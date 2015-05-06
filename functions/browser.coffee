remote = require 'remote'
dialog = remote.require 'dialog'
fs = require 'fs' # Cheat code, stupid Browserify.

# Browser prototype for Championify
window.Championify.browser = {
  openFolder: ->
    dialog.showOpenDialog {
      properties: ['openDirectory']
      title: 'Open League of Legends directory'
    }, (path) ->
      window.lolInstallPath = path
      $('#installPath').attr('value', path)
}

# Watchers
$('#browse').click (e) ->
  window.Championify.browser.openFolder()
