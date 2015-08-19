app = require 'app'
fs = require 'fs'
path = require 'path'
_ = require 'lodash'
BrowserWindow = require('browser-window')
require('crash-reporter').start()

# Keep a global reference of the window object, if you don't, the window will
# be closed automatically when the javascript object is GCed.
mainWindow = null

# Quit when all windows are closed.
app.on 'window-all-closed', ->
  app.quit()

# This method will be called when atom-shell has done everything
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
  if fs.existsSync('./dev_enabled') || fs.existsSync(path.join(__dirname, '..', 'dev_enabled'))
    mainWindow.openDevTools()

  # Avoid white page on load.
  mainWindow.webContents.on 'did-finish-load', ->
    mainWindow.show() if !_.contains(process.argv, '--autorun')

  mainWindow.on 'closed', ->
    # Dereference the window object, usually you would store windows
    # in an array if your app supports multi windows, this is the time
    # when you should delete the corresponding element.
    mainWindow = null
