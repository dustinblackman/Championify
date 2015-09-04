async = require 'async'
cheerio = require 'cheerio'
glob = require 'glob'
_ = require 'lodash'

hlp = require './helpers'
csspaths = require '../data/csspaths.json'

cErrors = require './errors'
champgg = require './sources/championgg'
lolflavor = require './sources/lolflavor'
preferences = require './preferences'
permissions = require './permissions'

cl = hlp.cl

# Set Defaults
window.cSettings = {}


#################
#      MAIN
#################

###*
 * Function Collects options from the Frontend.
 * @callback {Function} Callback.
###
getSettings = (step) ->
  window.cSettings = preferences.get().options
  preferences.save step


###*
 * Function Gets the latest Riot Version.
 * @callback {Function} Callback.
###
getRiotVer = (step, r) ->
  cl 'Getting LoL Version' if r
  hlp.ajaxRequest 'https://ddragon.leagueoflegends.com/realms/na.json', (err, body) ->
    return step(new cErrors.AjaxError('Can\'t get Riot Version').causedBy(err)) if err

    step null, body.v


###*
 * Function Downloads all available champs from Riot.
 * @callback {Function} Callback.
###
getChamps = (step, r) ->
  cl 'Downloading Champs from Riot'
  hlp.ajaxRequest "http://ddragon.leagueoflegends.com/cdn/#{r.riotVer}/data/en_US/champion.json", (err, body) ->
    return step(new cErrors.AjaxError('Can\'t get Champs').causedBy(err)) if err
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
deleteOldBuilds = (step, deletebtn) ->
  cl 'Deleting Old Builds'
  globbed = [
    glob.sync("#{window.item_set_path}**/CGG_*.json")
    glob.sync("#{window.item_set_path}**/CIFY_*.json")
  ]
  async.each _.flatten(globbed), (item, next) ->
    fs.unlink item, (err) ->
      # TODO: Fix
      window.log.warn(err) if err
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
        window.log.warn(err) if err

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
 * Function To output any champ/positions that were done due to timeouts or undefined builds.
 * @callback {Function} Callback.
###
notProcessed = (step) ->
  _.each window.undefinedBuilds, (e) ->
    cl "Not Available: #{e}", 'warn'

  step()


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
    cl 'Resetting File Permissions'
    champ_files = glob.sync(path.join(window.item_set_path, '**'))
    permissions.setWindowsPermissions(champ_files, step)
  else
    step()

###*
 * Function Main function that starts up all the magic.
 * @callback {Function} Callback.
###
downloadItemSets = (done) ->
  # Reset undefined builds
  window.undefinedBuilds = []

  async_tasks = {
    # Default
    settings: getSettings
    championTest: ['settings', permissions.championTest]
    riotVer: ['championTest', getRiotVer]
    champs_json: ['riotVer', getChamps]
    champs: ['champs_json', champNames]
    manaless: ['champs_json', genManaless]

    # ARAM
    aramItemSets: ['riotVer', 'manaless', lolflavor.aram]

    # Utils
    deleteOldBuilds: ['srItemSets', 'aramItemSets', deleteOldBuilds]
    saveBuilds: ['deleteOldBuilds', saveToFile]
    resavePreferences: ['saveBuilds', resavePreferences]
    setPermissions: ['saveBuilds', setWindowsPermissions]
    notProcessed: ['saveBuilds', notProcessed]
  }

  # Summoners Rift
  sr_source = $('#options_sr_source').val()
  if sr_source == 'lolflavor'
    async_tasks['srItemSets'] = ['riotVer', 'manaless', lolflavor.sr]
  else
    async_tasks['champggVer'] = ['championTest', champgg.version]
    async_tasks['srItemSets'] = ['champs', 'champggVer', 'manaless', champgg.sr]

  # Initialize progress bar
  hlp.updateProgressBar(true)

  async.auto async_tasks, (err) ->
    return window.endSession(err) if err
    hlp.updateProgressBar(10) # Just max it.
    cl 'Looks like we\'re all done. Login and enjoy!'
    done()


###*
 * Export.
###
module.exports = {
  run: downloadItemSets
  delete: deleteOldBuilds
  version: getRiotVer
}
