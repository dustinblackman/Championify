remote = require 'remote'
dialog = remote.require 'dialog'
fs = require 'fs'
exec = require('child_process').exec
https = require 'https'
open = require 'open'


###*
 * Function to download files.
 * @param {String} URL of download
 * @param {String} Local Destination
 * @callback {Function} Callback,
###
_downloadFile = (url, dest, cb) ->
  file = fs.createWriteStream(dest)
  https.get url, (res) ->
    res.pipe file
    file.on 'finish', ->
      file.close cb


###*
 * Function Reboots Championify specificially for each platform, and switches in new asar archive for updates.
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdaets
###
reloadUpdate = (appAsar, updateAsar) ->
  app = remote.require('app')

  if process.platform == 'darwin'
    fs.unlink appAsar, (err) ->
      fs.rename updateAsar, appAsar, (err) ->
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

    fs.writeFile 'update.bat', cmdArgs.join('\n'), 'utf8', () ->
      exec 'START update.bat'
      app.quit()


###*
 * Function checks for updates by calling package.json on Github, and executes accordingly.
###
runUpdates = ->
  window.Championify.checkVer (needUpdate, version) ->
    if needUpdate
      $('#mainContainer').hide()
      $('#updateContainer').show()

      url = 'https://github.com/dustinblackman/Championify/releases/download/'+version+'/update.asar'
      dest = __dirname.replace(/app.asar/g, '') + 'update-asar'

      _downloadFile url, dest, ->
        reloadUpdate(__dirname, dest)


###*
 * Function If platform is Windows, check if we can write to the user selected directory, and warn if not.
 * @callback {Function} Callback
###
isWindowsAdmin = (cb) ->
  if process.platform != 'darwin'
    fs.writeFile window.lolInstallPath + '/test.txt', 'Testing Write', (err) ->
      console.log err if err
      if err or !fs.existsSync(window.lolInstallPath + '/test.txt')
        cb 'err'
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

  if process.platform == 'darwin'
    if fs.existsSync('/Applications/League of Legends.app')
      setInstallPath null, '/Applications/League of Legends.app/', 'Contents/LoL/Config/Champions/'

    else if fs.existsSync(userHome + '/Applications/League of Legends.app')
      setInstallPath null, userHome + '/Applications/League of Legends.app/', 'Contents/LoL/Config/Champions/'

  else
    if fs.existsSync('C:/Riot Games/League Of Legends/lol.launcher.exe')
      setInstallPath null, 'C:/Riot Games/League Of Legends/', 'Config/Champions/'


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
      setInstallPath 'Not Found', path

  else
    # Default install, Garena Check 2
    if fs.existsSync(path + 'lol.launcher.exe') or fs.existsSync(path + 'League of Legends.exe')
      setInstallPath null, path, 'Config/Champions/'

    # Garena Installation Check 1
    else if fs.existsSync(path + 'LoLLauncher.exe')
      setInstallPath null, path, 'GameData/Apps/LoL/Game/Config/Champions/'

    else
      setInstallPath 'Not Found', path

###*
 * Function Sets the path string for the user to see on the interface.
 * @param {String} If !=, explains path error
 * @param {String} Install path
 * @param {String} Champion folder path relative to Install Path
###
setInstallPath = (pathErr, installPath, champPath) ->
  $('#inputMsg').removeAttr('class')
  $('#inputMsg').text('')

  if !champPath
    if process.platform == 'darwin'
      champPath = 'Contents/LoL/Config/Champions/'
    else
      champPath = 'Config/Champions/'

  window.lolInstallPath = installPath
  window.lolChampPath = installPath + champPath
  $('#installPath').val(installPath)

  isWindowsAdmin (err) ->
    if err
      $('#inputMsg').addClass('yellow')
      $('#inputMsg').text('Whoops! You need to run me as an admin. Right click on my file and hit "Run as Administrator"')

    else if pathErr
      $('#inputMsg').addClass('yellow')
      $('#inputMsg').text('You sure that\'s League?')
      $('#submitBtn').removeClass('disabled')

    else
      $('#inputMsg').addClass('green')
      $('#inputMsg').text('Looks Good!')
      $('#submitBtn').removeClass('disabled')

###*
 * Function to call Electrons OpenDialog. Sets title based on Platform.
###
openFolder = ->
  if process.platform == 'darwin'
    properties = ['openFile']
  else
    properties = ['openDirectory']


  dialog.showOpenDialog {
    properties: properties
    title: window.browseTitle
  }, (path) ->
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


###*
 * Watches for buttons pressed on GUI.
###
$('#browse').click (e) ->
  window.Championify.browser.openFolder()

$('.github > a').click (e) ->
  e.preventDefault()
  open('https://github.com/dustinblackman/Championify#faq')

###*
 * Called when "Import" button is pressed.
###
$('#submitBtn').click (e) ->
  if !window.lolInstallPath
    $('#inputMsg').addClass('yellow')
    $('#inputMsg').text('You need to select your folder first!')
  else
    $('.submitBtn').addClass('hidden')
    $('.status').removeClass('hidden')
    window.Championify.run()

###*
 * Executes on Page Load.
###
$(document).ready ->
  runUpdates()
  setupPlatform()
  $('#browseTitle').text(window.browseTitle)
  window.Championify.setVersion()
  $('.options [data-toggle="tooltip"]').tooltip()
  findInstallPath()


###*
 * Export
###
window.Championify.browser = {
  openFolder: openFolder
  remote: remote
}
