remote = require 'remote'
dialog = remote.require 'dialog'
app = remote.require('app')

fs = require 'fs'
exec = require('child_process').exec
https = require('follow-redirects').https
open = require 'open'
path = require 'path'
winston = require 'winston'
_ = require 'lodash'

cErrors = require './js/errors'
pkg = require './package.json'

window.devEnabled = fs.existsSync('./dev_enabled')

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
    checkInstallPath preferences.install_path, (err) ->
      if err
        findInstallPath()
      else
        setInstallPath null, preferences.install_path, preferences.champ_path

    _.each preferences.options, (val, key) ->
      if _.contains(key, 'position')
        $('#options_'+key).find('.'+val).addClass('active selected')
      else
        $('#options_'+key).prop('checked', val)
  else
    findInstallPath()


###*
 * Function to download files.
 * @param {String} URL of download
 * @param {String} Local Destination
 * @callback {Function} Callback
###
_downloadFile = (url, dest, cb) ->
  file = fs.createWriteStream(dest)
  https.get url, (res) ->
    res.pipe file
    file.on 'error', (err) ->
      return cb(err)
    file.on 'finish', ->
      file.close cb


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
reloadUpdate = (appAsar, updateAsar) ->
  if process.platform == 'darwin'
    fs.unlink appAsar, (err) ->
      return endSession(new cErrors.UpdateError('Can\'t unlink file').causedBy(err)) if err

      fs.rename updateAsar, appAsar, (err) ->
        return endSession(new cErrors.UpdateError('Can\'t rename app.asar').causedBy(err)) if err

        appPath = __dirname.replace('/Contents/Resources/app.asar', '')
        exec 'open -n ' + appPath
        app.quit()

  else
    cmdArgs = [
      '@echo off'
      'ping 1.1.1.1 -n 1 -w 3000 > nul',
      'del "'+appAsar+'"',
      'ren "'+updateAsar+'" app.asar',
      'start "" "'+process.execPath+'"',
      'exit']

    fs.writeFile 'update.bat', cmdArgs.join('\n'), 'utf8', (err) ->
      return endSession(new cErrors.UpdateError('Can\'t write update.bat').causedBy(err)) if err

      exec 'START update.bat'
      app.quit()


###*
 * Function checks for updates by calling package.json on Github, and executes accordingly.
###
runUpdates = ->
  window.Championify.checkVer (err, needUpdate, version) ->
    return endSession(err) if err

    if needUpdate
      $('#view').load('views/update.html')

      url = 'https://github.com/dustinblackman/Championify/releases/download/'+version+'/update.asar'
      dest = __dirname.replace(/app.asar/g, '') + 'update-asar'

      _downloadFile url, dest, (err) ->
        return endSession(err) if err
        reloadUpdate(__dirname, dest)


###*
 * Function If platform is Windows, check if we can write to the user selected directory, and warn if not.
 * @callback {Function} Callback
###
isWindowsAdmin = (cb) ->
  if process.platform != 'darwin'
    test_path = path.join(window.lol_install_path, 'test.txt')

    fs.writeFile test_path, 'Testing Write', (err) ->
      window.log.warn(err) if err

      if err or !fs.existsSync(test_path)
        cb(new Error('Can not write test file on Windows'))
      else
        fs.unlinkSync(test_path)
        cb null
  else
    cb null


###*
 * Function Auto discovery of League installation.
###
findInstallPath = ->
  userHome = process.env.HOME || process.env.USERPROFILE

  notFound = ->
    # $('#input_msg').text(window.browse_title)

  if process.platform == 'darwin'
    if fs.existsSync('/Applications/League of Legends.app')
      setInstallPath null, '/Applications/League of Legends.app/', 'Contents/LoL/Config/Champions/'

    else if fs.existsSync(userHome + '/Applications/League of Legends.app')
      setInstallPath null, userHome + '/Applications/League of Legends.app/', 'Contents/LoL/Config/Champions/'
    else
      notFound()

  else
    if fs.existsSync('C:/Riot Games/League Of Legends/lol.launcher.exe')
      setInstallPath null, 'C:/Riot Games/League Of Legends/', 'Config/Champions/'
    else
      notFound()


###*
 * Function Verifies the users selected install paths. Warns if no League related files/diretories are found.
 * @param {String} User selected path
###
checkInstallPath = (selected_path, done) ->
  selected_path = selected_path[0] if !_.isString(selected_path)
  if process.platform == 'darwin'
    if fs.existsSync(path.join(selected_path, 'Contents/LoL/'))
      done null, selected_path, 'Contents/LoL/Config/Champions/'

    else if fs.existsSync(path.join(selected_path, 'League of Legends.app'))
      done null, path.join(selected_path, 'League of Legends.app'), 'Contents/LoL/Config/Champions/'

    else
      done new Error('Path not found'), selected_path

  else
    # Default install, Garena Check 2
    if fs.existsSync(path.join(selected_path, 'lol.launcher.exe')) or fs.existsSync(path.join(selected_path, 'League of Legends.exe'))
      done null, selected_path, 'Config/Champions/'

    # Garena Installation Check 1
    else if fs.existsSync(path.join(selected_path + 'LoLLauncher.exe'))
      done null, selected_path, 'GameData/Apps/LoL/Game/Config/Champions/'

    else
      done new Error('Path not found'), selected_path

###*
 * Function Sets the path string for the user to see on the interface.
 * @param {String} If !=, explains path error
 * @param {String} Install path
 * @param {String} Champion folder path relative to Install Path
###
setInstallPath = (path_err, install_path, champ_path) ->
  enableBtns = ->
    $('#import_btn').removeClass('disabled')
    $('#delete_btn').removeClass('disabled')

  pathErr = ->
    $('#input_msg').addClass('yellow')
    $('#input_msg').text('You sure that\'s League?')
    enableBtns()

  foundLeague = ->
    $('#input_msg').addClass('green')
    $('#input_msg').text('Found League of Legends!')
    enableBtns()

  $('#input_msg').removeAttr('class')
  $('#input_msg').text('')

  if !champ_path
    if process.platform == 'darwin'
      champ_path = 'Contents/LoL/Config/Champions/'
    else
      champ_path = 'Config/Champions/'

  window.lol_install_path = install_path
  window.lol_champ_path = champ_path
  window.item_set_path = path.join(install_path, champ_path)
  $('#install_path').val(install_path)

  if process.platform == 'darwin'
    return pathErr() if path_err
    foundLeague()
  else
    isWindowsAdmin (err) ->
      if err
        $('#input_msg').addClass('yellow')
        $('#input_msg').text('Whoops! You need to run me as an admin. \
          Right click on my file and hit "Run as Administrator"')

      else if path_err
        pathErr()

      else
        foundLeague()

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
      checkInstallPath(selected_path, setInstallPath) if selected_path


###*
 * Function Sets platform specific variables.
###
setupPlatform = ->
  if process.platform == 'darwin'
    window.browse_title = 'Select League of Legends.app'

  else
    window.browse_title = 'Select League of Legends directory'
    $('.system-btns').attr('class','system-btns-right')


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

# $('#minimizeBtn').click (e) ->
#   e.preventDefault()
#   remote.getCurrentWindow().minimize()

# $('#closeBtn').click (e) ->
#   e.preventDefault()
#   app.quit()

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
    window.Championify.run ->
      $('.progress-striped').removeClass('active')

###*
 * Called when "Delete" button is pressed.
###
$(document).on 'click', '#delete_btn', ->
  if !window.lol_install_path
    $('#input_msg').addClass('yellow')
    $('#input_msg').text('You need to select your folder first!')
  else
    window.Championify.delete ->
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
window.Championify.remote = remote
window.endSession = endSession
window.preference_file = preference_file
