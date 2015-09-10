# File contains everything to initialize the app, plus functions that yet to have a home.

# Electron
remote = require 'remote'
app = remote.require 'app'
dialog = remote.require 'dialog'

# Deps
exec = require('child_process').exec
fs = require 'fs'
glob = require 'glob'
mkdirp = require 'mkdirp'
open = require 'open'
path = require 'path'
winston = require 'winston'
_ = require 'lodash'

# Championify
championify = require './js/championify'
cErrors = require './js/errors'
hlp = require './js/helpers'
optionsParser = require './js/options_parser'
preferences = require './js/preferences'
pathManager = require './js/path_manager'
pkg = require './package.json'
Translate = require './js/translate'
updateManager = require './js/update_manager'
viewManager = require './js/view_manager'

# Initialize Globals
window.devEnabled = fs.existsSync('./dev_enabled') or fs.existsSync(path.join(__dirname, '..', 'dev_enabled'))
window.T = new Translate(preferences.load()?.locale || 'en')

# Setup logger
error_log = path.join(preferences.directory(), 'championify.log')
window.Log = new (winston.Logger)({
  transports: [
    new winston.transports.Console({
        level: 'debug'
        handleExceptions: true
        json: true
    })
    new winston.transports.File({
      filename: error_log
      handleExceptions: true
      prettyPrint: true
      level: 'debug'
      options:
        flags: 'w'
    })
  ]
})
# Cheat code to do something when an uncaught exception comes up
Log.exitOnError = (err) ->
  if _.isString(err)
    e = new cErrors.UncaughtException(err)
  else
    e = new cErrors.UncaughtException().causedBy(err)
  EndSession(e)

  # Return false so the application doesn't exit.
  return false

###*
 * Function if error exists, enable error view and log error ending the session.
 * @param {Object} Error instance
###
EndSession = (c_error) ->
  if c_error
    cause = c_error.cause || c_error.rootCause || {}
    Log.error(c_error)

  viewManager.error()


###*
 * Function to upload log file to server
###
uploadLog = ->
  onError = ->
    $('#upload_log').attr('class','ui inverted red button')
    $('#upload_log').text('Failed')

  log_server = 'http://clogger.dustinblackman.com'
  log_server = 'http://127.0.0.1:8080' if window.devEnabled
  fs.readFile error_log, 'utf8', (err, data) ->
    Log.error(err) if err
    $('#upload_log').attr('class','ui inverted yellow button')
    $('#upload_log').text('Sending...')

    if !err
      $.post(log_server + '/submit', data)
        .done ->
          $('#upload_log').attr('class', 'ui green button')
          $('#upload_log').text('Sent!')
        .fail ->
          onError()
    else
      onError()


###*
 * Function to call Electrons OpenDialog. Sets title based on Platform.
###
folder_dialog_open = false
openFolder = ->
  if !folder_dialog_open
    folder_dialog_open = true
    if process.platform == 'win32'
      properties = ['openDirectory']
    else
      properties = ['openFile']

    dialog.showOpenDialog {
      properties: properties
      title: window.browse_title
    }, (selected_path) ->
      folder_dialog_open = false
      pathManager.checkInstallPath(selected_path, pathManager.setInstallPath) if selected_path


###*
 * Function Warn user if their league folder isn't selected.
###
selectFolderWarning = ->
  $('#input_msg').addClass('yellow')
  $('#input_msg').text('You need to select your folder first!')
  $('#input_msg').transition('shake')


###*
 * Function Checks and imports item sets
 * @callback {Function} Optional callback called after importing is done
###
importItemSets = (done) ->
  if !window.lol_install_path
    selectFolderWarning()
  else
    $('#btns_versions').addClass('hidden')
    $('.status').transition('fade up', '500ms')
    # TODO: Add new windows admin check before running this.
    championify.run ->
      return done() if done


###*
 * Function Checks and deletes item sets
###
deleteItemSets = ->
  if !window.lol_install_path
    selectFolderWarning()
  else
    # TODO: Verify if is Windows admin and can delete.
    championify.delete ->
      $('#cl_progress > span').append('. Done!')
    , true


###*
 * Function Goes through options parameters and acts.
###
executeOptionParameters = ->
  if optionsParser.delete()
    deleteItemSets()
  else if optionsParser.import() or optionsParser.autorun()
    importItemSets ->
      if optionsParser.close() or optionsParser.autorun()
        app.quit()
      else
        viewManager.complete()
        startLeague() if optionsParser.startLeague()


###*
 * Function Start the League of Legends client.
###
startLeague = ->
  exit = ->
    setTimeout ->
      app.quit()
    , 500

  if process.platform == 'darwin'
    exec "open -n \"#{window.lol_install_path}\""
    exit()
  else
    if (window.lol_executable)
      exec "\"#{path.join(window.lol_install_path, window.lol_executable)}\""
      exit()
    else
      Log.error("League of legends executable is not defined. #{window.lol_executable}")
      $('#start_league').attr('class','ui inverted red button')
      $('#start_league').text('Can\'t start League')


###*
 * Add system buttons
###
if process.platform == 'darwin'
  $('.osx_buttons').removeClass('hidden')
else
  $('.win_buttons').removeClass('hidden')


###*
 * Watches for buttons pressed on GUI.
###
$(document).on 'click', '#browse', ->
  openFolder()

$('.github > a').click (e) ->
  e.preventDefault()
  open('https://github.com/dustinblackman/Championify#faq')

$('.championify_version > span').click (e) ->
  e.preventDefault()
  open('https://github.com/dustinblackman/Championify/releases/latest')

log_uploaded = false
$(document).on 'click', '#upload_log', (e) ->
  e.preventDefault()
  uploadLog() if !log_uploaded
  log_uploaded = true

$(document).on 'click', '#import_btn', ->
  importItemSets(viewManager.complete)

$(document).on 'click', '#delete_btn', ->
  deleteItemSets()

$(document).on 'input', '#install_path', ->
  pathManager.checkInstallPath($(@).val(), pathManager.setInstallPath)

$(document).on 'click', '.sys_button.minimize', (e) ->
  e.preventDefault()
  remote.getCurrentWindow().minimize()

$(document).on 'click', '.sys_button.close', (e) ->
  e.preventDefault()
  app.quit()

$(document).on 'click', '#start_league', ->
  startLeague()

$(document).on 'click', '#back_to_main', ->
  viewManager.mainBack()


###*
* Execute ASAP after view load
###
viewManager.init ->
  updateManager.check (version, major) ->
    if version and major
      updateManager.majorUpdate(version)
    else if version
      updateManager.minorUpdate(version)
    else
      executeOptionParameters()
