app = require 'app'
exec = require('child_process').exec
fs = require 'fs'
path = require 'path'
_ = require 'lodash'
BrowserWindow = require('browser-window')
require('crash-reporter').start()

preferences = require './js/preferences'

dev_enabled = fs.existsSync('./dev_enabled') || fs.existsSync(path.join(__dirname, '..', 'dev_enabled'))

# Windows Specific Dependencies
if process.platform == 'win32'
  runas = require 'runas'


# If were starting to simply update on windows with admin privileges, execute update and exit.
# When we do this here when a user is restarting with admin privileges, it'll show it's starting Championify
# compared to a batch file which would of looked a bit odd.
if _.contains(process.argv, '--winMajor')
  update_file = path.join(preferences.directory(), 'update_major.bat')
  return exec 'START "" "' + update_file + '"', {cwd: path.join(process.cwd(), '..')}


# Reboot if process needs to be runned as admin
if _.contains(process.argv, '--startAsAdmin')
  args = _.clone(process.argv)
  args.shift()
  args = _.remove args, (item) -> item != '--startAsAdmin'
  args.push '--runnedAsAdmin'

  params = ['/c', 'taskkill', '/IM', 'championify.exe', '/f', '&', process.execPath].concat(args)
  params = params.concat(['&', 'exit'])

  return runas('cmd', params, {hide: true, admin: true})


# Keep a global reference of the window object, if you don't, the window will
# be closed automatically when the javascript object is GCed.
mainWindow = null

# Quit when all windows are closed.
app.on 'window-all-closed', ->
  app.quit()

# This method will be called when electron has done everything
# initialization and ready for creating browser windows.
app.on 'ready', ->
  # Create the browser window.
  mainWindow = new BrowserWindow({
    fullscreen: false
    width: 400
    height: 600
    center: true
    resizable: false
    show: false
    frame: false
    title: 'Championify'
  })

  # and load the index.html of the app.
  mainWindow.loadUrl 'file://'+__dirname+'/index.html'
  # Emitted when the window is closed.

  # Enable dev stuff if needed.
  if dev_enabled
    mainWindow.openDevTools({detach: true})

  # Avoid white page on load.
  mainWindow.webContents.on 'did-finish-load', ->
    mainWindow.show() if !_.contains(process.argv, '--autorun')

  mainWindow.on 'closed', ->
    mainWindow = null
