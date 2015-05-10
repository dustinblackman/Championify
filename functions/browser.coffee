remote = require 'remote'
dialog = remote.require 'dialog'
fs = require 'fs'


# We check if we can write to directory.
# If no admin and is required, warn.
isWindowsAdmin = (cb) ->
  if process.platform != 'darwin'
    fs.writeFile window.lolChampPath + '/test.txt', 'Testing Write', (err) ->
      if err or !fs.existsSync(window.lolChampPath + '/test.txt')
        cb 'err'
      else
        fs.unlinkSync(window.lolChampPath + '/test.txt')
        cb null
  else
    cb null


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


checkInstallPath = (path) ->
  # TODO Change these two to check for LoL binary instead of folder path.
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
  console.log window.lolChampPath
  $('#installPath').attr('value', installPath)

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


openFolder = ->
  if process.platform == 'darwin'
    title = 'Select League of Legends.app'
    properties = ['openFile']
  else
    title = 'Open League of Legends directory'
    properties = ['openDirectory']


  dialog.showOpenDialog {
    properties: properties
    title: title
  }, (path) ->
    if path.slice(-1) != '/' and path.slice(-1) != '\\'
      if process.platform == 'darwin'
        path = path+'/'
      else
        path = path+'\\'

    checkInstallPath(path)


# Watchers
$('#browse').click (e) ->
  window.Championify.browser.openFolder()

$('.github > a').click (e) ->
  e.preventDefault()
  open('https://github.com/dustinblackman/Championify')

# Import
$('#submitBtn').click (e) ->
  if !window.lolInstallPath
    $('#inputMsg').addClass('yellow')
    $('#inputMsg').text('You need to select your folder first!')
  else
    $('.submitBtn').addClass('hidden')
    $('.status').removeClass('hidden')
    window.Championify.run()

# On load
$(document).ready ->
  $('.options [data-toggle="tooltip"]').tooltip()
  window.Championify.setVersion()
  findInstallPath()

# Browser prototype for Championify
window.Championify.browser = {
  openFolder: openFolder
}
