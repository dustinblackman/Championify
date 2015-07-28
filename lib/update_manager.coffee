remote = require 'remote'
app = remote.require('app')
fs = require 'fs'
_ = require 'lodash'
https = require('follow-redirects').https
exec = require('child_process').exec
path = require 'path'

cErrors = require './errors'
hlp = require './helpers'


###*
 * Function Compares version numbers. Returns 1 if left is highest, -1 if right, 0 if the same.
 * @param {String} First (Left) version number.
 * @param {String} Second (Right) version number.
 * @returns {Number}.
###
versionCompare = (left, right) ->
  if typeof left + typeof right != 'stringstring'
    return false

  a = left.split('.')
  b = right.split('.')
  i = 0
  len = Math.max(a.length, b.length)

  while i < len
    if a[i] and !b[i] and parseInt(a[i]) > 0 or parseInt(a[i]) > parseInt(b[i])
      return 1
    else if b[i] and !a[i] and parseInt(b[i]) > 0 or parseInt(a[i]) < parseInt(b[i])
      return -1
    i++

  return 0


###*
 * Function Downloads update file
 * @callback {Function} Callback.
###
download = (version) ->
  self = @
  $('#view').load('views/update.html')

  url = 'https://github.com/dustinblackman/Championify/releases/download/'+version+'/update.asar'
  app_asar = path.join(__dirname, '..')
  update_asar = path.join(__dirname, '../../', 'update-asar')

  try
    file = fs.createWriteStream(update_asar)
  catch e
    return cb(new cErrors.UpdateError('Can\'t write update-asar').causedBy(e))

  https.get url, (res) ->
    res.pipe file
    file.on 'error', (err) ->
      return endSession(err) if err
    file.on 'finish', ->
      file.close()
      if process.platform == 'darwin'
        self.osx(app_asar, update_asar)
      else
        self.win(app_asar, update_asar)


###*
 * Function Reboots Championify for updates on OSX
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdaets
###
osx = (app_asar, update_asar) ->
  fs.unlink app_asar, (err) ->
    return window.endSession(new cErrors.UpdateError('Can\'t unlink file').causedBy(err)) if err

    fs.rename update_asar, app_asar, (err) ->
      return window.endSession(new cErrors.UpdateError('Can\'t rename app.asar').causedBy(err)) if err

      appPath = __dirname.replace('/Contents/Resources/app.asar/js', '')
      exec 'open -n ' + appPath
      app.quit()


###*
 * Function Reboots Championify for updates on Windows
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdaets
###
win = (app_asar, update_asar) ->
  cmd = _.template('
    @echo off\n
    echo Updating Championify, please wait...\n
    taskkill /IM championify.exe /f\n
    ping 1.1.1.1 -n 1 -w 1000 > nul\n
    del "${app_asar}"\n
    ren "${update_asar}" app.asar\n
    start "" "${exec_path}"\n
    exit\n
  ')

  params = {
    app_asar: app_asar
    update_asar: update_asar
    exec_path: process.execPath
  }

  fs.writeFile 'update.bat', cmd(params), 'utf8', (err) ->
    return endSession(new cErrors.UpdateError('Can\'t write update.bat').causedBy(err)) if err
    exec 'START update.bat'


###*
 * Function Check version of Github package.json and local. Executes update if available.
  * @callback {Function} Callback, only accepts a single finished parameter as errors are handled with endSession.
###
check = (done) ->
  self = @

  url = 'https://raw.githubusercontent.com/dustinblackman/Championify/master/package.json'
  hlp.ajaxRequest url, (err, data) ->
    return window.endSession(new cErrors.AjaxError('Can\'t access Github package.json').causedBy(err)) if err

    data = JSON.parse(data)
    if self.versionCompare(data.version, pkg.version) == 1
      return done(data.version)
    else
      return done(null)


module.exports = {
  versionCompare: versionCompare
  check: check
  download: download
  osx: osx
  win: win
}
