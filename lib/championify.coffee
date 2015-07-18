cheerio = require 'cheerio'
async = require 'async'
_ = require 'lodash'

hlp = require './helpers.coffee'
pkg = require '../package.json'
csspaths = require '../data/csspaths.json'

cErrors = require './errors.coffee'
rift = require './summoners_rift.coffee'
aram = require './aram.coffee'
cl = hlp.cl

# Set Defaults
GLOBAL.cSettings = {}
GLOBAL.undefinedBuilds = []


#################
#      MAIN
#################


###*
 * Function Check version of Github package.json and local.
 * @callback {Function} Callback.
###
# TODO: Does this really have to be here?
checkVer = (step) ->
  url = 'https://raw.githubusercontent.com/dustinblackman/Championify/master/package.json'
  hlp.ajaxRequest url, (err, data) ->
    return window.endSession(new cErrors.AjaxError('Can\'t access Github package.json').causedBy(err)) if err

    data = JSON.parse(data)
    if hlp.versionCompare(data.version, pkg.version) == 1
      step null, true, data.version
    else
      step null, false


###*
 * Function Collects options from the Frontend.
 * @callback {Function} Callback.
###
getSettings = (step) ->
  GLOBAL.cSettings = {
    splititems: $('#options_splititems').is(':checked')
    skillsformat: $('#options_skillsformat').is(':checked')
    trinkets: $('#options_trinkets').is(':checked')
    consumables: $('#options_consumables').is(':checked')
    locksr: $('#options_locksr').is(':checked')
  }

  fs.writeFile window.preference_file, JSON.stringify(GLOBAL.cSettings, null, 2), {encoding: 'utf8'}, (err) ->
    window.logger.warn(err) if err
    step null


###*
 * Function Gets the latest Riot Version.
 * @callback {Function} Callback.
###
getRiotVer = (step) ->
  cl 'Getting LoL Version'
  hlp.ajaxRequest 'https://ddragon.leagueoflegends.com/realms/na.json', (err, body) ->
    return step(new cErrors.AjaxError('Can\'t get Riot Version').causedBy(err)) if err

    hlp.updateProgressBar(1.5)
    step null, body.v


###*
  * Function Gets current version Champion.GG is using.
  * @callback {Function} Callback.
###
getChampionGGVer = (step) ->
  cl 'Getting Champion.GG Version'
  hlp.ajaxRequest 'http://champion.gg/faq/', (err, body) ->
    return step(new cErrors.AjaxError('Can\'t get Champion.GG Version').causedBy(err)) if err

    $c = cheerio.load(body)
    window.champGGVer = $c(csspaths.version).text()
    hlp.updateProgressBar(1.5)
    step null


###*
 * Function Downloads all available champs from Riot.
 * @callback {Function} Callback.
###
getChamps = (step, r) ->
  cl 'Downloading Champs from Riot'
  hlp.ajaxRequest 'http://ddragon.leagueoflegends.com/cdn/'+r.riotVer+'/data/en_US/champion.json', (err, body) ->
    return step(new cErrors.AjaxError('Can\'t get Champs').causedBy(err)) if err
    step null, Object.keys(body.data)


# TODO: This doesn't work on Windows if the files were created with admin priveleges but are trying to delete without.
###*
 * Function Deletes all previous Championify builds from client.
 * @callback {Function} Callback.
###
deleteOldBuilds = (step, deletebtn) ->
  cl 'Deleting Old Builds'
  glob window.lolChampPath+'**/CGG_*.json', (err, files) ->
    return step(new cErrors.OperationalError('Can\'t glob for old item set files').causedBy(err)) if err

    async.each files, (item, next) ->
      fs.unlink item, (err) ->
        # TODO: Fix
        window.log.warn(err) if err
        next null
    , () ->
      hlp.updateProgressBar(2.5) if !deletebtn
      step null


###*
 * Function To output any champ/positions that were done due to timeouts or undefined builds.
 * @callback {Function} Callback.
###
notProcessed = (step) ->
  _.each GLOBAL.undefinedBuilds, (e) ->
    cl 'Not Available: '+e, 'warn'

  step()


###*
 * Function Main function that starts up all the magic.
 * @callback {Function} Callback.
###
downloadItemSets = (done) ->
  async.auto {
    # Default
    settings: getSettings
    champGGVer: getChampionGGVer
    riotVer: getRiotVer
    champs:  ['riotVer', getChamps]

    # Summoners Rift
    riftItemSets: ['champs', 'champGGVer', rift.requestChamps]
    riftSave: ['deleteOldBuilds', 'riftItemSets', rift.save]

    # ARAM
    aramChamps: aram.requestChamps
    aramItemSets: ['riotVer','aramChamps', aram.requestData]
    aramSave: ['deleteOldBuilds','aramItemSets', aram.save]

    # Utils
    deleteOldBuilds: ['riftItemSets', 'aramItemSets', deleteOldBuilds]

    # End
    notProcessed: ['riftSave', 'aramSave', notProcessed]
  }, (err) ->
    return endSession(err) if err
    hlp.updateProgressBar(10) # Just max it.
    cl 'Looks like we\'re all done. Login and enjoy!'
    done()


###*
 * Export.
###
window.Championify = {
  run: downloadItemSets
  checkVer: checkVer
  delete: deleteOldBuilds
}
