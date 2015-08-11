remote = require 'remote'
app = remote.require('app')
async = require 'async'
exec = require('child_process').exec
fs = require 'fs-extra'
https = require('follow-redirects').https
path = require 'path'
tar = require 'tar-fs'
zlib = require 'zlib'
_ = require 'lodash'

cErrors = require './errors'
hlp = require './helpers'
preferences = require './preferences'


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
download = (url, download_path, done) ->
  download_precentage = 0

  try
    file = fs.createWriteStream(download_path)
  catch e
    return done(err)

  https.get url, (res) ->
    len = parseInt(res.headers['content-length'], 10)
    downloaded = 0

    res.pipe file
    res.on 'data', (chunk) ->
      downloaded += chunk.length
      current_precentage = parseInt(100.0 * downloaded / len)

      if current_precentage > download_precentage
        download_precentage = current_precentage
        hlp.incrUIProgressBar('update_progress_bar', download_precentage)

    file.on 'error', (err) ->
      return done(err)

    file.on 'finish', ->
      file.close()
      done()

###*
 * Function Sets up flow for download minor update (just update.asar)
 * @callback {Function} Callback.
###
minorUpdate = (version) ->
  $('#view').load('views/update.html')

  url = 'https://github.com/dustinblackman/Championify/releases/download/' + version + '/update.asar'
  app_asar = path.join(__dirname, '..')
  update_asar = path.join(__dirname, '../../', 'update-asar')

  download url, update_asar, ->
    if process.platform == 'darwin'
      osxMinor(app_asar, update_asar)
    else
      winMinor(app_asar, update_asar)


###*
 * Function Sets up flow for download major update (replacing entire install directory)
 * @callback {Function} Callback.
###
majorUpdate = (version) ->
  $('#view').load('views/update.html')

  if process.platform == 'darwin'
    platform = 'OSX'
    install_path = path.join(__dirname, '../../../../')
    tar_name = 'u_osx.tar.gz'
  else
    platform = 'WIN'
    install_path = path.join(__dirname, '../../../')
    tar_name = 'u_win.tar.gz'

  tar_path = path.join(preferences.directory(), tar_name)
  install_path = install_path.substring(0, install_path.length - 1)
  update_path = path.join(preferences.directory(), 'major_update')

  url = 'https://github.com/dustinblackman/Championify/releases/download/' + version + '/' + tar_name

  async.series [
    (step) -> # Delete previous update folder if exists
      if fs.existsSync(update_path)
        fs.remove update_path, (err) ->
          step(err)
      else
        step()
    (step) -> # Download Tarball
      download url, tar_path, (err) ->
        return step(new cErrors.UpdateError('Can\'t write/download update file').causedBy(e)) if err
        step()
    (step) -> # Extract Tarball
      $('#update_current_file').text('Extracting...')
      stream = fs.createReadStream(tar_path)
      stream.pipe(zlib.Gunzip()).pipe(tar.extract(update_path))
      stream.on 'end', ->
        step()
    (step) -> # Delete Tarball
      fs.unlink tar_path, (err) ->
        return step(new cErrors.UpdateError('Can\'t unlink major update zip').causedBy(err)) if err
        step()
  ], (err) ->
    return window.endSession(err) if err

    if process.platform == 'darwin'
      osxMajor(install_path, update_path)
    else
      winMajor(install_path, update_path)


###*
 * Function Reboots Championify for minor updates on OSX
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdaets
###
osxMinor = (app_asar, update_asar) ->
  fs.unlink app_asar, (err) ->
    return window.endSession(new cErrors.UpdateError('Can\'t unlink file').causedBy(err)) if err

    fs.rename update_asar, app_asar, (err) ->
      return window.endSession(new cErrors.UpdateError('Can\'t rename app.asar').causedBy(err)) if err

      appPath = __dirname.replace('/Contents/Resources/app.asar/js', '')
      exec 'open -n ' + appPath
      setTimeout ->
        app.quit()
      , 250


###*
 * Function Reboots Championify for major updates on OSX
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdaets
###
osxMajor = (install_path, update_path) ->
  cmd = _.template([
    'echo -n -e "\\033]0;Updating ${name}\\007"'
    'echo Updating ${name}, please wait...'
    'killall ${name}'
    'mv "${update_path}/Contents/Resources/atom-asar" "${update_path}/Contents/Resources/atom.asar"'
    'mv "${update_path}/Contents/Resources/app-asar" "${update_path}/Contents/Resources/app.asar"'
    'rm -rf "${install_path}"'
    'mv "${update_path}" "${install_path}"'
    'open -n "${install_path}"'
    'exit'
  ].join('\n'))

  update_path = path.join(update_path, 'Championify.app')

  params = {
    install_path: install_path
    update_path: update_path
    name: pkg.name
  }
  update_file = path.join(preferences.directory(), 'update_major.sh')

  fs.writeFile update_file, cmd(params), 'utf8', (err) ->
    return window.endSession(new cErrors.UpdateError('Can\'t write update_major.sh').causedBy(err)) if err

    exec 'bash "' + update_file + '"'


###*
 * Function Reboots Championify for updates on Windows
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdaets
###
winMinor = (app_asar, update_asar) ->
  cmd = _.template('
    @echo off\n
    title Updating Championify
    echo Updating Championify, please wait...\n
    taskkill /IM ${process_name} /f\n
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
    process_name: path.basename(process.execPath)
  }

  fs.writeFile 'update.bat', cmd(params), 'utf8', (err) ->
    return window.endSession(new cErrors.UpdateError('Can\'t write update.bat').causedBy(err)) if err
    exec 'START update.bat'


###*
 * Function Reboots Championify for major updates on Windows
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdaets
###
winMajor = (install_path, update_path) ->
  cmd = _.template([
    '@echo off'
    'title Updating Championify'
    'echo Updating Championify, please wait...'
    'taskkill /IM ${process_name} /f'
    'ping 1.1.1.1 -n 1 -w 3000 > nul'
    'echo Renaming app.asar'
    'ren "${update_path}\\resources\\app-asar" app.asar'
    'echo Renaming atom.asar'
    'ren "${update_path}\\resources\\atom-asar" atom.asar'
    'echo Removing Install Path: ${install_path}'
    'rmdir "${install_path}" /s /q'
    'echo Moving Championify'
    'move "${update_path}" "${root_path}"'
    'echo Starting Championify'
    'start "" "${exec_path}"'
    'exit'
  ].join('\n'))

  # TODO: Get path of where the app is installed to be used when re-executing, instead of defaulting to 'Championify'.

  update_path = path.join(update_path, 'Championify')
  root_path = path.resolve(path.join(install_path, '../'))

  params = {
    install_path: install_path
    update_path: update_path
    root_path: root_path
    exec_path: process.execPath
    process_name: path.basename(process.execPath)
  }

  update_file = path.join(preferences.directory(), 'update_major.bat')

  fs.writeFile update_file, cmd(params), 'utf8', (err) ->
    return window.endSession(new cErrors.UpdateError('Can\'t write update.bat').causedBy(err)) if err
    exec 'START "" "' + update_file + '"'


###*
 * Function Check version of Github package.json and local. Executes update if available.
  * @callback {Function} Callback, only accepts a single finished parameter as errors are handled with endSession.
###
check = (done) ->
  url = 'https://raw.githubusercontent.com/dustinblackman/Championify/master/package.json'
  hlp.ajaxRequest url, (err, data) ->
    return window.endSession(new cErrors.AjaxError('Can\'t access Github package.json').causedBy(err)) if err

    data = JSON.parse(data)
    if versionCompare(data.version, pkg.version) == 1
      return done(data.version)
    else
      return done(null)


module.exports = {
  check: check
  minorUpdate: minorUpdate
  majorUpdate: majorUpdate
}
