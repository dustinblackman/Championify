cheerio = require 'cheerio'
fs = require 'fs-extra'
glob = require 'glob'
gulp = require 'gulp'
request = require 'request'
runSequence = require 'run-sequence'
path = require 'path'

gulp.task 'build-artifact:osx', ->
  runSequence(
    'package-asar'
    'compile:osx'
    'zip:osx'
    'upload-artifcat'
  )

gulp.task 'build-artifact:win', ->
  runSequence(
    'package-asar'
    'compile:win'
    'zip:win'
    'upload-artifcat'
  )

gulp.task 'build-artifact', (cb) ->
  if process.platform == 'win32'
    return runSequence('build-artifact:win', cb)
  else
    return runSequence('build-artifact:osx', cb)

gulp.task 'upload-artifcat', (cb) ->
  commit = process.env.APPVEYOR_REPO_COMMIT or process.env.TRAVIS_COMMIT or 'NO_COMMIT'
  file = glob.sync('./releases/*.zip')[0]
  file_name = "Championify-#{process.platform}-#{commit}.zip"

  upload_file = path.join('./releases', file_name)
  fs.move file, upload_file, ->
    options = {
      method: 'POST'
      url: 'http://www92.zippyshare.com/upload'
      headers: {
        Referer: 'http://www.zippyshare.com/sites/index_old.jsp'
      }
    }

    console.log('Uploading file...')
    req = request options, (err, res, body) ->
      $c = cheerio.load(body)
      download_url = $c('.text_field').val()
      fs.writeFile './download.txt', download_url, {encoding: 'utf8'}, cb

    form = req.form()
    form.append('file', fs.createReadStream(upload_file))
