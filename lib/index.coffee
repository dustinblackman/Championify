# Electron
remote = require 'remote'
dialog = remote.require 'dialog'
app = remote.require('app')

# Deps
fs = require 'fs'
exec = require('child_process').exec
open = require 'open'
path = require 'path'
winston = require 'winston'
_ = require 'lodash'
mkdirp = require 'mkdirp'
glob = require 'glob'

# Championify
championify = require './js/championify'
hlp = require './js/helpers'
pathManager = require './js/path_manager'
cErrors = require './js/errors'
pkg = require './package.json'

window.devEnabled = fs.existsSync('./dev_enabled') or fs.existsSync('../../dev_enabled')

# Set preference directory and file
if process.platform == 'darwin'
  preference_dir = path.join(process.env.HOME, 'Library/Application Support/Championify/')
else
  preference_dir = path.join(process.env.APPDATA, 'Championify')
preference_file = path.join(preference_dir, 'prefs.json')

# Setup logger
if window.devEnabled
  error_log = path.join(__dirname, '..', 'championify.log')
else
  error_log = path.join(preference_dir, 'championify.log')

window.log = new (winston.Logger)({
  transports: [
    new winston.transports.Console({
        level: 'debug'
        handleExceptions: true
    })
    new winston.transports.File({
      filename: error_log
      handleExceptions: true
      prettyPrint: true,
      level: 'debug'
      options:
        level: 'w'
    })
  ]
})
# Cheat code to do something when an uncaught exception comes up
window.log.exitOnError = ->
  endSession()

  # Return false so the application doesn't exit.
  return false

###*
 * Function if error exists, enable error view and log error ending the session.
 * @param {Object} Error instance
###
endSession = (c_error) ->
  if c_error
    cause = c_error.cause || {}
    window.log.error(c_error)

  $('#view').load('views/error.html')


###*
 * Function to upload log file to server
###
uploadLog = ->
  log_server = 'http://clogger.dustinblackman.com'
  log_server = 'http://127.0.0.1:8080' if window.devEnabled
  fs.readFile error_log, 'utf8', (err, data) ->
    window.log.error(err) if err
    $('#upload_log').attr('class','ui inverted yellow button')
    $('#upload_log').text('Sending...')

    # TODO Do something with error reading log file.
    if !err
      $.post log_server + '/submit', data, (res) ->
        $('#upload_log').attr('class', 'ui green button')
        $('#upload_log').text('Sent!')
    else
      $('#upload_log').attr('class','ui inverted red button')
      $('#upload_log').text('Failed')


###*
 * Function to load prefence files
###
loadPreferences = ->
  if fs.existsSync(preference_file)
    preferences = require preference_file
    pathManager.checkInstallPath preferences.install_path, (err) ->
      if err
        pathManager.findInstallPath()
      else
        pathManager.setInstallPath null, preferences.install_path, preferences.champ_path

    _.each preferences.options, (val, key) ->
      if _.contains(key, 'position')
        $('#options_'+key).find('.'+val).addClass('active selected')
      else
        $('#options_'+key).prop('checked', val)
  else
    pathManager.findInstallPath()


###*
 * Function Read package file and set version in bottom right corner of interface.
###
setVersion = ->
  $('.version > span').text('v'+pkg.version)


###*
 * Function Reboots Championify specificially for each platform, and switches in new asar archive for updates.
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdaets
###
reloadUpdate = (app_asar, update_asar) ->
  if process.platform == 'darwin'
    fs.unlink app_asar, (err) ->
      return endSession(new cErrors.UpdateError('Can\'t unlink file').causedBy(err)) if err

      fs.rename update_asar, app_asar, (err) ->
        return endSession(new cErrors.UpdateError('Can\'t rename app.asar').causedBy(err)) if err

        appPath = __dirname.replace('/Contents/Resources/app.asar', '')
        exec 'open -n ' + appPath
        app.quit()

  else
    cmd = _.template('
      @echo off\n
      echo Updating Championify, please wait...\n
      taskkill /IM championify.exe /f\n
      ping 1.1.1.1 -n 1 -w 3000 > nul\n
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
 * Function checks for updates by calling package.json on Github, and executes accordingly.
###
runUpdates = ->
  hlp.checkVer (err, needUpdate, version) ->
    return endSession(err) if err

    if needUpdate
      $('#view').load('views/update.html')

      url = 'https://github.com/dustinblackman/Championify/releases/download/'+version+'/update.asar'
      dest = __dirname.replace(/app.asar/g, '') + 'update-asar'

      hlp.downloadFile url, dest, (err) ->
        return endSession(err) if err
        reloadUpdate(__dirname, dest)


###*
 * Function to call Electrons OpenDialog. Sets title based on Platform.
###
folder_dialog_open = false
openFolder = ->
  if !folder_dialog_open
    folder_dialog_open = true
    if process.platform == 'darwin'
      properties = ['openFile']
    else
      properties = ['openDirectory']

    dialog.showOpenDialog {
      properties: properties
      title: window.browse_title
    }, (selected_path) ->
      folder_dialog_open = false
      pathManager.checkInstallPath(selected_path, pathManager.setInstallPath) if selected_path


###*
 * Function Sets platform specific variables.
###
setupPlatform = ->
  if process.platform == 'darwin'
    window.browse_title = 'Select League of Legends.app'
  else
    window.browse_title = 'Select League of Legends directory'


###*
 * Watches for buttons pressed on GUI.
###
$(document).on 'click', '#browse', ->
  openFolder()

$('.github > a').click (e) ->
  e.preventDefault()
  open('https://github.com/dustinblackman/Championify#faq')

log_uploaded = false
$(document).on 'click', '#upload_log', (e) ->
  e.preventDefault()
  uploadLog() if !log_uploaded
  log_uploaded = true


###*
 * Called when "Import" button is pressed.
###
$(document).on 'click', '#import_btn', ->
  if !window.lol_install_path
    $('#input_msg').addClass('yellow')
    $('#input_msg').text('You need to select your folder first!')
  else
    $('.submitBtns').addClass('hidden')
    $('.status').removeClass('hidden')
    # TODO: Add new windows admin check before running this.
    championify.run ->
      $('.progress-striped').removeClass('active')


###*
 * Called when "Delete" button is pressed.
###
$(document).on 'click', '#delete_btn', ->
  if !window.lol_install_path
    $('#input_msg').addClass('yellow')
    $('#input_msg').text('You need to select your folder first!')
  else
    # TODO: Verify if is Windows admin and can delete.
    championify.delete ->
      $('#cl-progress > span').append('. Done!')
    , true


###*
* Execute ASAP after view load
###
$('#view').load 'views/main.html', ->
  setupPlatform()
  $('#browse_title').text(window.browse_title)
  setVersion()

  $(".options_tooltip").popup()
  $('.ui.dropdown').dropdown()

  runUpdates()
  loadPreferences()


###*
 * Export
###
window.remote = remote
window.endSession = endSession
window.preference_file = preference_file
