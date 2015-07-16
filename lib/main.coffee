remote = require 'remote'
dialog = remote.require 'dialog'
app = remote.require('app')

fs = require 'fs'
exec = require('child_process').exec
https = require('follow-redirects').https
open = require 'open'
path = require 'path'
winston = require 'winston'
pkg = require './package.json'

window.devEnabled = fs.existsSync('./dev_enabled')

# Setup logger
if window.devEnabled
  error_log = path.join(__dirname, '..', 'championify.log')
else
  if process.platform == 'darwin'
    error_log = path.join(process.env.HOME, 'Library/Application Support/Championify/championify.log')
  else
    error_log = path.join(process.env.APPDATA, 'Championify/championify.log')

window.logger = new (winston.Logger)({
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
window.logger.exitOnError = ->
  endSession()

  # Return false so the application doesn't exit.
  return false

###*
 * Function if error exists, enable error view and log error ending the session.
 * @param {Object} Error instance
###
endSession = (err) ->
  window.logger.error(err) if err
  $('#view').load('views/error.html')


###*
 * Function to upload log file to hastebin
###
uploadLog = ->
  fs.readFile error_log, 'utf8', (err, data) ->
    # TODO Do something with error reading log file.
    if !err
      $.post 'http://hastebin.com/documents', data, (res) ->
        open('http://hastebin.com/' + res.key)


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
      return endSession(err) if err

      fs.rename updateAsar, appAsar, (err) ->
        return endSession(err) if err

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
      return endSession(err) if err

      exec 'START update.bat'
      app.quit()


###*
 * Function checks for updates by calling package.json on Github, and executes accordingly.
###
runUpdates = ->
  window.Championify.checkVer (needUpdate, version) ->
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
    fs.writeFile window.lolInstallPath + '/test.txt', 'Testing Write', (err) ->
      window.logger.warn(err)
      if err or !fs.existsSync(window.lolInstallPath + '/test.txt')
        cb(new Error('Can not write test file on Windows'))
      else
        fs.unlinkSync(window.lolInstallPath + '/test.txt')
        cb null
  else
    cb null


###*
 * Function Auto discovery of League installation.
###
findInstallPath = ->
  userHome = process.env.HOME || process.env.USERPROFILE

  notFound = ->
    $('#input_msg').text(window.browseTitle)

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
checkInstallPath = (path) ->
  if process.platform == 'darwin'
    if fs.existsSync(path + 'Contents/LoL/')
      setInstallPath null, path, 'Contents/LoL/Config/Champions/'

    else if fs.existsSync(path + 'League of Legends.app')
      setInstallPath null, path+'League of Legends.app/', 'Contents/LoL/Config/Champions/'

    else
      setInstallPath(new Error('Path not found'), path)

  else
    # Default install, Garena Check 2
    if fs.existsSync(path + 'lol.launcher.exe') or fs.existsSync(path + 'League of Legends.exe')
      setInstallPath null, path, 'Config/Champions/'

    # Garena Installation Check 1
    else if fs.existsSync(path + 'LoLLauncher.exe')
      setInstallPath null, path, 'GameData/Apps/LoL/Game/Config/Champions/'

    else
      setInstallPath(new Error('Path not found'), path)

###*
 * Function Sets the path string for the user to see on the interface.
 * @param {String} If !=, explains path error
 * @param {String} Install path
 * @param {String} Champion folder path relative to Install Path
###
setInstallPath = (pathErr, install_path, champ_path) ->
  $('#input_msg').removeAttr('class')
  $('#input_msg').text('')

  if !champ_path
    if process.platform == 'darwin'
      champ_path = 'Contents/LoL/Config/Champions/'
    else
      champ_path = 'Config/Champions/'

  window.lolInstallPath = install_path
  window.lolChampPath = install_path + champ_path
  $('#install_path').val(install_path)

  enableBtns = ->
    $('#import_btn').removeClass('disabled')
    $('#delete_btn').removeClass('disabled')


  isWindowsAdmin (err) ->
    if err
      $('#input_msg').addClass('yellow')
      $('#input_msg').text('Whoops! You need to run me as an admin. \
        Right click on my file and hit "Run as Administrator"')

    else if pathErr
      $('#input_msg').addClass('yellow')
      $('#input_msg').text('You sure that\'s League?')
      enableBtns()

    else
      $('#input_msg').addClass('green')
      $('#input_msg').text('Found League of Legends!')
      enableBtns()

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
      title: window.browseTitle
    }, (path) ->
      folder_dialog_open = false
      if path
        if path.slice(-1) != '/' and path.slice(-1) != '\\'
          if process.platform == 'darwin'
            path = path+'/'
          else
            path = path+'\\'

      checkInstallPath(path)


###*
 * Function Sets platform specific variables.
###
setupPlatform = ->
  if process.platform == 'darwin'
    window.browseTitle = 'Select League of Legends.app'

  else
    window.browseTitle = 'Select League of Legends directory'
    $('.system-btns').attr('class','system-btns-right')


###*
 * Watches for buttons pressed on GUI.
###
$(document).on 'click', '#browse', ->
  openFolder()

$('.github > a').click (e) ->
  e.preventDefault()
  open('https://github.com/dustinblackman/Championify#faq')

$(document).on 'click', '#reddit_msg', (e) ->
  e.preventDefault()
  open('https://www.reddit.com/message/compose/?to=DustinHeroin')

$(document).on 'click', '#github_issues', (e) ->
  e.preventDefault()
  open('https://github.com/dustinblackman/Championify/issues')

$(document).on 'click', '#upload_log', (e) ->
  e.preventDefault()
  uploadLog()

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
  if !window.lolInstallPath
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
  if !window.lolInstallPath
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
  $('#browseTitle').text(window.browseTitle)
  setVersion()
  $('.options [data-toggle="tooltip"]').tooltip()

  runUpdates()
  findInstallPath()


###*
 * Export
###
window.Championify.remote = remote
window.endSession = endSession
