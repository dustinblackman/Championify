async = require 'async'
cheerio = require 'cheerio'
fs = require 'fs-extra'
glob = require 'glob'
path = require 'path'
_ = require 'lodash'

hlp = require './helpers'
csspaths = require '../data/csspaths.json'

cErrors = require './errors'
champgg = require './sources/championgg'
lolflavor = require './sources/lolflavor'
preferences = require './preferences'
permissions = require './permissions'

# Windows Specific Dependencies
if process.platform == 'win32'
  runas = require 'runas'

cl = hlp.cl

# Set Defaults
window.cSettings = {}


#################
#      MAIN
#################

###*
 * Function Saves options from the frontend.
 * @callback {Function} Callback.
###
saveSettings = (step) ->
  preferences.save step


###*
 * Function Gets the latest Riot Version.
 * @callback {Function} Callback.
###
getRiotVer = (step, r) ->
  cl "#{T.t('lol_version')}" if r
  hlp.request 'https://ddragon.leagueoflegends.com/realms/na.json', (err, body) ->
    return step(new cErrors.RequestError('Can\'t get Riot Version').causedBy(err)) if err

    step null, body.v


###*
 * Function Downloads all available champs from Riot.
 * @callback {Function} Callback.
###
getChamps = (step, r) ->
  cl "#{T.t('downloading_champs')}"
  hlp.request "http://ddragon.leagueoflegends.com/cdn/#{r.riotVer}/data/#{T.riotLocale()}/champion.json", (err, body) ->
    return step(new cErrors.RequestError('Can\'t get Champs').causedBy(err)) if err or !body.data

    # Save translated champ names
    translated_champs = _.mapValues body.data, (data) -> return data.name
    T.merge(translated_champs)

    step null, body.data


###*
 * Function Returns array of champs
 * @callback {Function} Callback.
###
champNames = (step, r) ->
  return step null, _.keys(r.champs_json)


###*
 * Function Generate manaless champs array
 * @callback {Function} Callback.
###
genManaless = (step, r) ->
  manaless = _.map r.champs_json, (champ_obj) ->
    return champ_obj.id if champ_obj.partype != 'Mana'

  step null, _.compact(manaless)


# TODO: This doesn't work on Windows if the files were created with admin priveleges but are trying to delete without.
###*
 * Function Deletes all previous Championify builds from client.
 * @callback {Function} Callback.
###
deleteOldBuilds = (step, r, deletebtn) ->
  return step() if window.cSettings.dontdeleteold and !deletebtn

  cl "#{T.t('deleting_old_builds')}"
  globbed = [
    glob.sync("#{window.item_set_path}**/CGG_*.json")
    glob.sync("#{window.item_set_path}**/CIFY_*.json")
  ]
  async.each _.flatten(globbed), (item, next) ->
    fs.unlink item, (err) ->
      return next(new cErrors.FileWriteError("Can\'t unlink file: #{item}").causedBy(err)) if err
      next null
  , ->
    hlp.updateProgressBar(2.5) if !deletebtn
    step null


# TODO: This is a messy function. Clean it up with Lodash, possibly.
###*
 * Function Saves all compiled item sets to file, creating paths included.
 * @callback {Function} Callback.
###
saveToFile = (step, r) ->
  champData = _.merge(_.clone(r.srItemSets, true), r.aramItemSets)

  async.each _.keys(champData), (champ, next) ->
    async.each _.keys(champData[champ]), (position, nextPosition) ->
      toFileData = JSON.stringify(champData[champ][position], null, 4)
      folder_path = path.join(window.item_set_path, champ, 'Recommended')

      mkdirp folder_path, (err) ->
        Log.warn(err) if err

        file_path = path.join(window.item_set_path, champ, "Recommended/CIFY_#{champ}_#{position}.json")
        fs.writeFile file_path, toFileData, (err) ->
          return nextPosition(new cErrors.FileWriteError('Failed to write item set json file').causedBy(err)) if err
          nextPosition null

    , (err) ->
      return next(err) if err
      next null

  , (err) ->
    return step(err) if err
    step null


###*
 * Function Resave preferences with new local version
###
resavePreferences = (step, r) ->
  prefs = preferences.get()
  prefs.local_is_version = hlp.spliceVersion(r.riotVer)
  preferences.save(prefs, step)


###*
 * Function Set windows permissions if required
###
setWindowsPermissions = (step, r) ->
  if process.platform == 'win32' and optionsParser.runnedAsAdmin()
    cl "#{T.t('resetting_file_permission')}"
    champ_files = glob.sync(path.join(window.item_set_path, '**'))
    permissions.setWindowsPermissions(champ_files, step)
  else
    step()

###*
 * Function Main function that starts up all the magic.
 * @callback {Function} Callback.
###
downloadItemSets = (done) ->
  # Get settings
  window.cSettings = preferences.get().options

  # Reset undefined builds
  window.undefinedBuilds = []

  async_tasks = {
    # Default
    settings: saveSettings
    championTest: ['settings', permissions.championTest]
    riotVer: ['championTest', getRiotVer]
    champs_json: ['riotVer', getChamps]
    champs: ['champs_json', champNames]
    manaless: ['champs_json', genManaless]

    # Utils
    deleteOldBuilds: ['srItemSets', deleteOldBuilds]
    saveBuilds: ['deleteOldBuilds', saveToFile]
    resavePreferences: ['saveBuilds', resavePreferences]
    setPermissions: ['saveBuilds', setWindowsPermissions]
  }

    # ARAM
  if cSettings.aram
    async_tasks['aramItemSets'] = ['riotVer', 'manaless', lolflavor.aram]
    async_tasks.deleteOldBuilds.unshift('aramItemSets')

  # Summoners Rift
  if cSettings.sr_source == 'lolflavor'
    async_tasks['srItemSets'] = ['riotVer', 'manaless', lolflavor.sr]
  else
    async_tasks['champggVer'] = ['championTest', champgg.version]
    async_tasks['srItemSets'] = ['champs', 'champggVer', 'manaless', champgg.sr]

  # Initialize progress bar
  hlp.updateProgressBar(true)

  async.auto async_tasks, (err) ->
    # If it's a file write problem and is windows, then run as admin.
    if err instanceof cErrors.FileWriteError and process.platform == 'win32' and !optionsParser.runnedAsAdmin()
      Log.error(err)
      return runas(process.execPath, ['--startAsAdmin', '--import'], {hide: false, admin: true})

    return EndSession(err) if err

    hlp.updateProgressBar(10) # Just max it.
    done()


###*
 * Export.
###
module.exports = {
  run: downloadItemSets
  delete: deleteOldBuilds
  version: getRiotVer
}
