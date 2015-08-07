# Electron
remote = require 'remote'
app = remote.require 'app'
dialog = remote.require 'dialog'

# Deps
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
updateManager = require './js/update_manager'


window.devEnabled = fs.existsSync('./dev_enabled') or fs.existsSync(path.join(__dirname, '..', 'dev_enabled'))

# Setup logger
error_log = path.join(preferences.directory(), 'championify.log')
window.log = new (winston.Logger)({
  transports: [
    new winston.transports.Console({
        level: 'debug'
        handleExceptions: true
        json: true
    })
    new winston.transports.File({
      filename: error_log
      handleExceptions: true
      prettyPrint: true,
      level: 'debug'
      options:
        flags: 'w'
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
    cause = c_error.cause || c_error.rootCause || {}
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
 * Function Checks and imports item sets
 * @callback {Function} Optional callback called after importing is done
###
importItemSets = (done) ->
  if !window.lol_install_path
    $('#input_msg').addClass('yellow')
    $('#input_msg').text('You need to select your folder first!')
  else
    $('.submitBtns').addClass('hidden')
    $('.status').removeClass('hidden')
    # TODO: Add new windows admin check before running this.
    championify.run ->
      $('.progress-striped').removeClass('active')
      return done() if done


###*
 * Function Checks and deletes item sets
###
deleteItemSets = ->
  if !window.lol_install_path
    $('#input_msg').addClass('yellow')
    $('#input_msg').text('You need to select your folder first!')
  else
    # TODO: Verify if is Windows admin and can delete.
    championify.delete ->
      $('#cl-progress > span').append('. Done!')
    , true


###*
 * Function Goes through options parameters and acts.
###
executeOptionParameters = ->
  if optionsParser.delete()
    deleteItemSets()
  else if optionsParser.import() or optionsParser.autorun()
    importItemSets ->
      app.quit() if optionsParser.close() or optionsParser.autorun()


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

$(document).on 'click', '#import_btn', ->
  importItemSets()

$(document).on 'click', '#delete_btn', ->
  deleteItemSets()

$(document).on 'input', '#install_path', ->
  console.log($(this).val())
  pathManager.checkInstallPath($(this).val(), pathManager.setInstallPath)


###*
* Execute ASAP after view load
###
$('#view').load 'views/main.html', ->
  setupPlatform()
  $('#browse_title').text(window.browse_title)
  $('.version > span').text('v'+pkg.version)

  $(".options_tooltip").popup()
  $('.ui.dropdown').dropdown()

  preferences.load()
  updateManager.check (version) ->
    if version
      updateManager.minorUpdate(version)
    else
      executeOptionParameters()


###*
 * Export
###
window.endSession = endSession
