async = require 'async'
fs = require 'fs-extra'
GitHubApi = require 'github'
glob = require 'glob'
gulp = require 'gulp'
path = require 'path'
request = require 'request'
_ = require 'lodash'

pkg = require '../package.json'
GLOBAL.vtReports = {}


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
            }
            url: upload_url
          }

          request.post options, (err, res, body) ->
            body = JSON.parse(body)
            GLOBAL.vtReports[path.basename(file_path)] = body.permalink
            acb null

        , (err) ->
          step null
  ], (err) ->
    console.log GLOBAL.vtReports
    cb null


gulp.task 'github-release', (cb) ->
  # Setup Github API
  github = new GitHubApi {
    version: '3.0.0'
    # debug: true
    protocol: 'https'
    timeout: 5000
    headers: {
      'user-agent': 'Championify-Gulp-Release'
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
        body += '\n\n## Virus Total Reports\n'

        link = _.template('[<%- name %> | VirusTotal Report](<%- link %>)\n')
        _.each _.keys(GLOBAL.vtReports), (item) ->
          if _.includes(item, 'Windows_Setup')
            body += link({name: 'Windows Setup', link: GLOBAL.vtReports[item]})

          if _.includes(item, '.WIN.')
            body += link({name: 'Windows ZIP', link: GLOBAL.vtReports[item]})

          if _.includes(item, 'OSX')
            body += link({name: 'Mac/OSX', link: GLOBAL.vtReports[item]})

          if _.includes(item, 'asar')
            body += link({name: 'update.asar', link: GLOBAL.vtReports[item]})

          if _.includes(item, 'u_osx')
            body += link({name: 'u_osx.tar.gz', link: GLOBAL.vtReports[item]})

          if _.includes(item, 'u_win')
            body += link({name: 'u_win.tar.gz', link: GLOBAL.vtReports[item]})


        body += [
          ''
          '## How to Download:'
          'Below you\'ll find the download section. If you\'re on Windows, your best bet it to select the "Windows Setup" to get yourself started with Championify. If you have trouble installing you can always try the ".zip" version.'
          'For Mac, download the file labeled "OSX", extract the .zip, and you\'ll be good to go!'
        ].join('\n')

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
            owner: 'dustinblackman'
            repo: 'Championify'
            id: release_id
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
