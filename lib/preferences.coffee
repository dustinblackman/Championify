_ = require 'lodash'
cErrors = require './errors'
fs = require 'fs'
path = require 'path'
pathManager = require './path_manager'
sourceUIManager = require './source_ui_manager'

###*
 * Function to loads and applies preference files
###
load = ->
  preference_file = @file()
  if fs.existsSync(preference_file)
    preferences = JSON.parse(fs.readFileSync(preference_file))

    # Load non-option preferences.
    $('#local_version').text(preferences.local_is_version || 'Unknown')

    pathManager.checkInstallPath preferences.install_path, (err) ->
      if err
        pathManager.findInstallPath()
      else
        pathManager.checkInstallPath preferences.install_path, pathManager.setInstallPath

    _.each preferences.options, (val, key) ->
      if key == 'sr_source' and val == 'lolflavor'
        sourceUIManager.lolflavor()
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
  if _.isFunction(preferences)
    done = preferences
    preferences = null

  preferences = preferences || get()
  return done(cErrors.OperationalError('Preferences object does not exist')) if !preferences

  preference_file = preferenceFile()
  fs.writeFile preference_file, JSON.stringify(preferences, null, 2), {encoding: 'utf8'}, (err) ->
    if err
      window.log.warn(err)
    else
      window.log.info("Saved preference file to #{preference_file}")
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
  return path.join(preferenceDir(), 'prefs.json')


###*
 * Function gets preferences
###
get = ->
  # Positions default to bottom.
  consumables_position = if $('#options_consumables_position').find('.beginning').hasClass('selected') then 'beginning' else 'end'
  trinkets_position = if $('#options_trinkets_position').find('.beginning').hasClass('selected') then 'beginning' else 'end'

  return {
    install_path: window.lol_install_path
    champ_path: window.lol_champ_path
    local_is_version: $('#local_version').text()
    options: {
      splititems: $('#options_splititems').is(':checked')
      skillsformat: $('#options_skillsformat').is(':checked')
      consumables: $('#options_consumables').is(':checked')
      consumables_position: consumables_position
      trinkets: $('#options_trinkets').is(':checked')
      trinkets_position: trinkets_position
      locksr: $('#options_locksr').is(':checked')
      sr_source: $('#options_sr_source').val()
    }
  }


module.exports = {
  load: load
  save: save
  directory: preferenceDir
  file: preferenceFile
  get: get
}
