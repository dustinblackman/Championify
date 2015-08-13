_ = require 'lodash'
fs = require 'fs'
path = require 'path'
pathManager = require './path_manager'

###*
 * Function to load preference files
###
load = ->
  preference_file = @file()
  if fs.existsSync(preference_file)
    preferences = require preference_file
    pathManager.checkInstallPath preferences.install_path, (err) ->
      if err
        pathManager.findInstallPath()
      else
        pathManager.setInstallPath null, preferences.install_path, preferences.champ_path

    _.each preferences.options, (val, key) ->
      if key == 'sr_source'
        if val == 'lolflavor'
          $('#options_sr_source').val(val)
          $('#sr_source_text').text($('.rift_source').find('[data-value="lolflavor"]').text())
          $('.rift_source').find('[data-value="championgg"]').attr('class', 'item')
          $('.rift_source').find('[data-value="lolflavor"]').addClass('selected active')

      else if _.contains(key, 'position')
        $('#options_'+key).find('.'+val).addClass('active selected')
      else
        $('#options_'+key).prop('checked', val)
  else
    pathManager.findInstallPath()


###*
 * Function to save preference file
###
save = (preferences, done) ->
  preference_file = @file()
  fs.writeFile preference_file, JSON.stringify(preferences, null, 2), {encoding: 'utf8'}, (err) ->
    if err
      window.log.warn(err)
    else
      window.log.info('Saved preference file to ' + preference_file)
    done()


###*
 * Function set preference directory
###
preferenceDir = ->
  # Set preference directory and file
  if process.platform == 'darwin'
    preference_dir = path.join(process.env.HOME, 'Library/Application Support/Championify/')
  else
    preference_dir = path.join(process.env.APPDATA, 'Championify')
  return preference_dir


###*
 * Function set preference file path
###
preferenceFile = ->
  return path.join(@directory(), 'prefs.json')


module.exports = {
  load: load
  save: save
  directory: preferenceDir
  file: preferenceFile
}
