async = require 'async'
aws = require 'aws-sdk'
exec = require('child_process').exec
fs = require 'fs-extra'
gulp = require 'gulp'
moment = require 'moment'
open = require 'open'
path = require 'path'
request = require 'request'
runSequence = require 'run-sequence'
SuperError = require 'super-error'
travis = require path.join(__dirname, 'helpers/travis.coffee')
_ = require 'lodash'


SkipCoverallsError = SuperError.subclass('SkipCoverallsError')


_exec = (cmd, done) ->
  exec cmd, (err, stdout, stderr) ->
    console.log(stdout) if stdout
    console.log(stderr) if stderr
    done(err)

_istanbul = (report_type, done) ->
  _exec "#{path.resolve('./node_modules/.bin/istanbul')} report #{report_type}", done

# Travis, runned on Appveyor
fromTravis = (done) ->
  aws.config.update({
    accessKeyId: process.env.AWS_KEY
    secretAccessKey: process.env.AWS_TOKEN
  })

  s3 = new aws.S3({params: {Bucket: 'dustinblackman-travis-artifacts'}})
  s3.listObjects {Prefix: "dustinblackman/Championify/#{process.env.APPVEYOR_BUILD_NUMBER}"}, (err, data) ->
    return done(err) if err
    coverage_key = null

    # TODO: Might have to reserve this array first.
    _.each data.Contents, (obj) ->
      if !coverage_key and _.contains(obj.Key, 'coverage-coffee.json')
        coverage_key = obj.Key

    return done() if !coverage_key

    s3.getObject {Key: coverage_key}, (err, data) ->
      return done(err) if err

      coverage_json = JSON.parse(data.Body.toString())
      done(null, coverage_json)


# Appveyor, runned on Travis
fromAppveyor = (done) ->
  build_number = "#{process.env.TRAVIS_BRANCH}-#{process.env.TRAVIS_BUILD_NUMBER}"
  headers = {
    Authorization: "Bearer #{process.env.APPVEYOR_KEY}"
    'Content-type': 'application/json'
  }
  options = {
    url: "https://ci.appveyor.com/api/projects/dustinblackman/Championify/build/#{build_number}"
    headers: headers
  }

  request options, (err, res, body) ->
    return done(err) if err

    build_data = JSON.parse(body)
    job_data = _.find(build_data.build.jobs, {name: 'Platform: x86'})

    return done() if !job_data or job_data.status != 'success'

    options = {
      url: "https://ci.appveyor.com/api/buildjobs/#{job_data.jobId}/artifacts/coverage/coverage-coffee.json"
      headers: headers
    }
    request options, (err, res, body) ->
      return done(err) if err
      done(null, JSON.parse(body))


onCoveralls = (done) ->
  commit = process.env.APPVEYOR_REPO_COMMIT or process.env.TRAVIS_COMMIT
  request "https://coveralls.io/builds/#{commit}.json", (err, res, body) ->
    return done(new SkipCoverallsError('Commit already on Coveralls')) if res.statusCode == 200
    return done()


coverageDownload = (done) ->
  if process.env.APPVEYOR
    getCoverage = fromTravis
  else if process.env.TRAVIS
    getCoverage = fromAppveyor
  else
    return done(new SkipCoverallsError('Not on CI'))

  getCoverage (err, coverage_json) ->
    if err or !coverage_json
      console.log(err) if err
      return done(new SkipCoverallsError('Other CI is not ready yet, skipping...'))

    converted_coverage = {}
    _.each coverage_json, (coverage_data) ->
      file = coverage_data.path.split('lib')[1].replace(/\\/g, '/')
      file = file.substring(1) if file[0] == '/'

      coverage_data.path = path.join(__dirname, '..', 'lib', file)
      converted_coverage[coverage_data.path] = coverage_data

    coverage_path = path.join(__dirname, '..', 'coverage/coverage-other.json')
    fs.writeFile coverage_path, JSON.stringify(converted_coverage), {encoding: 'utf8'}, done


coverallsSetup = (done) ->
  if process.env.TRAVIS
    cmd = 'cat ./coverage/lcov.info | ./node_modules/.bin/coveralls'
    fs.writeFile './coveralls.sh', cmd, {encoding: 'utf8'}, (err) ->
      return done(err) if err
      _exec 'bash ./coveralls.sh', done

  else
    async.waterfall [
      (step) -> # Get current job id from travis.
        travis.token (err, token) ->
          return step(err) if err

          params = {
            url: 'https://api.travis-ci.org/repos/dustinblackman/Championify/builds'
            headers: {Authorization: "token \"#{token}\""}
            method: 'GET'
          }

          travis.request params, (err, body) ->
            return step(err) if err

            build_number = process.env.APPVEYOR_BUILD_NUMBER.toString()
            build = _.find(body.builds, {number: build_number})

            return step(new Error("Could not find travis build number: #{build_number}")) if !build
            step(null, build.job_ids[0])

      (job_id, step) -> # Set enviroment variables.
        cmds = [
          "SET COVERALLS_RUN_AT=#{moment().format('YYYY-MM-DDTHH:mm:ssZ')}"
          "SET COVERALLS_SERVICE_JOB_ID=#{job_id}"
          "SET COVERALLS_GIT_BRANCH=#{process.env.APPVEYOR_REPO_BRANCH}"
          "SET COVERALLS_GIT_COMMIT=#{process.env.APPVEYOR_REPO_COMMIT}"
          'type .\\coverage\\lcov.info | .\\node_modules\\.bin\\coveralls'
        ]
        fs.writeFileSync './coveralls.bat', cmds.join('\n'), {encoding: 'utf8'}
        step()

    ], (err) ->
      return done(err) if err
      _exec '.\\coveralls.bat', done


gulp.task 'istanbul', (cb) ->
  _istanbul('text-summary', cb)

gulp.task 'coveralls', (cb) ->
  if (process.env.APPVEYOR and !process.env.AWS_KEY) or (process.env.TRAVIS and !process.env.APPVEYOR_KEY)
    console.log('Coveralls is disabled for pull requests')
    return cb()

  async.series [
    (step) -> onCoveralls(step)
    (step) -> coverageDownload(step)
    (step) -> _istanbul('lcov text-summary', step)
    (step) -> coverallsSetup(step)
  ], (err) ->
    if err instanceof SkipCoverallsError
      console.log(err.message)
      return cb()
    else
      return cb(err)

gulp.task 'coverage', (cb) ->
  open path.resolve(path.join(__dirname, '../coverage/lcov-report/index.html'))
  cb()
