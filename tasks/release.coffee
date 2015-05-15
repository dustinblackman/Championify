gulp      = require 'gulp'
request 	= require 'request'
async 		= require 'async'
path 			= require 'path'
glob 			= require 'glob'
fs 				= require 'fs-extra'
gutil			= require 'gulp-util'


GLOBAL.vtReports = {}

virusTotal = (file, rootUrl, cb) ->
  gutil.log '[VIRUSTOTAL] Uploading: ' + path.basename(file)
  url = 'https://www.virustotal.com/vtapi/v2/url/scan'

  gutil.log rootUrl + '/' + path.basename(file)

  formData = {
    apikey: process.env.VIRUSTOTAL
    url: rootUrl + '/' + path.basename(file)
  }
  options = {
    url: url,
    formData: formData
  }

  request.post options, (err, res, body) ->
    cb err if err
    if body.indexOf('<html>') > -1
      return cb body

    body = JSON.parse(body)
    console.log(body)
    cb null, body.permalink


gulp.task 'virustotal', (cb) ->
  glob './releases/**' , {nodir: true}, (err, files) ->
    async.each files, (file, acb) ->
      filename = path.basename(file)
      virusTotal file, rootUrl, (err, vtLink) ->
        if err
          console.log(err)
          process.exit(0)
        GLOBAL.vtReports[filename] = vtLink
        acb null
    , () ->
      cb()
