gulp = require 'gulp'
GitHubApi = require 'github'
fs = require 'fs-extra'
async = require 'async'
glob = require 'glob'
path = require 'path'
request = require 'request'
_ = require 'lodash'
AdmZip = require 'adm-zip'
nsis = require 'gulp-nsis'

pkg = require '../package.json'
GLOBAL.vtReports = {}

gulp.task 'move-asar', (cb) ->
  fs.copy './tmp/app.asar', './releases/update.asar', -> cb()


gulp.task 'virustotal', (cb) ->
  async.waterfall [
    (step) ->
      request.get 'https://www.virustotal.com/vtapi/v2/file/scan/upload_url?apikey='+process.env.VIRUSTOTAL, (err, res, body) ->
        step null, JSON.parse(body).upload_url

    (upload_url, step) ->
      glob './releases/*', (err, files) ->
        async.eachSeries files, (file_path, acb) ->
          console.log '[VIRUSTOTAL] Uploading: '+file_path
          options = {
            formData: {
              file: fs.createReadStream(file_path)
            },
            url: upload_url
          }

          request.post options, (err, res, body) ->
            body = JSON.parse(body)
            GLOBAL.vtReports[path.basename(file_path)] = body.permalink
            acb null

        , (err) ->
          step null
  ], (err) ->
    cb null


gulp.task 'github-release', (cb) ->
  # Setup Github API
  github = new GitHubApi {
    version: "3.0.0"
    # debug: true
    protocol: "https"
    timeout: 5000
    headers: {
      "user-agent": "Championify-Gulp-Release"
    }
  }

  github.authenticate {
    type: 'oauth'
    token: process.env.GITHUB_TOKEN
  }


  async.waterfall [
    # Create release draft
    (step) ->
      fs.readFile './CHANGELOG.md', {encoding: 'utf8'}, (err, changelog) ->
        body = changelog.split(/<a name="*.*.*" \/>/g)[1]
        body += '\n\n#### Virus Total Reports\n'

        link = _.template('[<%- name %> | VirusTotal Report](<%- link %>)\n')
        _.each _.keys(GLOBAL.vtReports), (item) ->
          if _.includes(item, 'WIN')
            body += link({name: 'Windows', link: GLOBAL.vtReports[item]})

          if _.includes(item, 'MAC')
            body += link({name: 'Mac/OSX', link: GLOBAL.vtReports[item]})

          if _.includes(item, 'asar')
            body += link({name: 'update.asar', link: GLOBAL.vtReports[item]})


        create_release = {
          owner: 'dustinblackman'
          repo: 'Championify'
          tag_name: pkg.version
          draft: true
          name: 'Championify '+pkg.version
          body: body
        }

        github.releases.createRelease create_release, (err, release) ->
          step err, release.id

    # Upload Assets
    (release_id, step) ->
      glob './releases/*', (err, files) ->
        async.eachSeries files, (file_path, acb) ->
          console.log '[GITHUB] Uploading: ' + file_path
          upload_file = {
            owner: 'dustinblackman',
            repo: 'Championify',
            id: release_id,
            name: path.basename(file_path)
            filePath: file_path
          }

          github.releases.uploadAsset upload_file, (err, done) ->
            acb null

        , (err) ->
          console log err if err
          step err

  ], ->
    cb()


gulp.task 'windows-installer', ->
  zip = new AdmZip GLOBAL.releaseFile({'platform': 'WIN'})
  zip.extractAllTo './tmp/championify_windows', true

  nsi = _.template(fs.readFileSync('./resources/win/Championify.nsi'), {}, {interpolate: /{{([\s\S]+?)}}/g})

  dataPath = path.resolve('./tmp/championify_windows').replace(/\//g,'\\')
  releasePath = __dirname.replace(/\//g,'\\') +'\\releases'
  if process.platform != 'win32'
    releasePath = 'Z:'+root
    dataPath = 'Z:'+dataPath

  nsi_compiled = nsi({
    version: pkg.version
    description: pkg.description
    outputFolder: releasePath
    exe: pkg.name
    dataPath: dataPath
  })

  fs.writeFileSync './tmp/installerscript.nsi', nsi_compiled, {encoding: 'utf8'}
  return gulp.src('./tmp/installerscript.nsi').pipe(nsis())
