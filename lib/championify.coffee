cheerio = require 'cheerio'
async = require 'async'
_ = require 'lodash'

hlp = require './helpers'
csspaths = require '../data/csspaths.json'

cErrors = require './errors'
rift = require './summoners_rift'
aram = require './aram'
cl = hlp.cl

# Set Defaults
window.cSettings = {}
window.undefinedBuilds = []


#################
#      MAIN
#################

###*
 * Function Collects options from the Frontend.
 * @callback {Function} Callback.
###
getSettings = (step) ->
  # Positions default to bottom.
  consumables_position = if $('#options_consumables_position').find('.beginning').hasClass('selected') then 'beginning' else 'end'
  trinkets_position = if $('#options_trinkets_position').find('.beginning').hasClass('selected') then 'beginning' else 'end'

  window.cSettings = {
    splititems: $('#options_splititems').is(':checked')
    skillsformat: $('#options_skillsformat').is(':checked')
    consumables: $('#options_consumables').is(':checked')
    consumables_position: consumables_position
    trinkets: $('#options_trinkets').is(':checked')
    trinkets_position: trinkets_position
    locksr: $('#options_locksr').is(':checked')
  }

  preferences = {
    options: window.cSettings
    install_path: window.lol_install_path
    champ_path: window.lol_champ_path
  }

  fs.writeFile window.preference_file, JSON.stringify(preferences, null, 2), {encoding: 'utf8'}, (err) ->
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
  glob window.item_set_path+'**/CGG_*.json', (err, files) ->
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
  _.each window.undefinedBuilds, (e) ->
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
    champs_json:  ['riotVer', getChamps]
    champs: ['champs_json', champNames]
    manaless: ['champs_json', genManaless]

    # Summoners Rift
    riftItemSets: ['champs', 'champGGVer', 'manaless', rift.requestChamps]
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
module.exports = {
  run: downloadItemSets
  delete: deleteOldBuilds
}
