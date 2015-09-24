_ = require 'lodash'
async = require 'async'

hlp = require '../helpers'
defaultSchema = require '../../data/default.json'

cl = hlp.cl

###*
 * Function Request json from available champs
 * @param {String} Type of process (ARAM, Jungle, Support, Lane)
 * @param {String} Name of stats file
 * @callback {Function} Callback.
###
_requestAvailableChamps = (process_name, stats_file, done) ->
  hlp.request "http://www.lolflavor.com/data/#{stats_file}", (err, body) ->
    # Some antivirus' don't like lolfavor. Skip all ARAM builds if so and log error.
    if err
      Log.warn(err)
      window.undefinedBuilds.push("#{process_name}: All")
      return done null, []

    champs = _.map body.champions, (item) -> return item.name
    champs.sort()

    done null, champs

###*
 * Function Request ARAM item sets from lolflavor.
 * @callback {Function} Callback.
 * @param {Object} Async Auto Object
###
_requestData = (champs_names, process_name, riotVer, manaless, step) ->
  champs = {}

  async.eachLimit champs_names, 3, (champ, next) ->
    cl "#{T.t('processing')} #{T.t(process_name)}: #{T.t(champ)}"

    url = "http://www.lolflavor.com/champions/#{champ}/Recommended/#{champ}_#{process_name.toLowerCase()}_scrape.json"
    hlp.request url, (err, data) ->
      if err
        Log.warn(err)
        window.undefinedBuilds.push({champ: champ, position: process_name})
        return next null

      if process_name == 'ARAM'
        data.map = 'HA'
        data.blocks[0].items.push({count: 1, id: '2047'})
      if process_name != 'ARAM'
        data.map = 'SR' if window.cSettings.locksr
        data.blocks.shift()
        data.blocks = hlp.trinksCon(data.blocks, champ, manaless)

      data.title = process_name + ' ' + riotVer
      champs[champ] = {}
      champs[champ][process_name.toLowerCase()] = data

      hlp.updateProgressBar(30 / champs_names.length) if process_name != 'ARAM'
      next null
  , (err) ->
    return step(err) if err
    step null, champs


###*
 * Function Handle processing lolflavor
 * @param {String} Name of process (ARAM, Jungle, ect)
 * @param {String} Name of .json file on lolflavor
 * @param {String} Riot version
 * @param {Array} Manaless champs
 * @callback {Function} Callback.
###
_processLolflavor = (process_name, stats_file, riotVer, manaless, step) ->
  # cl "#{T.t('downloading')} #{T.t(process_name)} #{T.t('champs')}"
  Log.info "Downloading #{process_name} Champs"
  riotVer = hlp.spliceVersion(riotVer)

  _requestAvailableChamps process_name, stats_file, (err, champ_names) ->
    return step(err) if err

    _requestData(champ_names, process_name, riotVer, manaless, step)


###*
 * Function Helper to request item sets for aram
 * @callback {Function} Callback.
###
aram = (step, r) ->
  _processLolflavor('ARAM', 'statsARAM.json', r.riotVer, r.manaless, step)


###*
 * Function Helper to request item sets for summoners rift
 * @callback {Function} Callback.
###
summonersRift = (step, r) ->
  async.series {
    lane: (next) -> _processLolflavor('Lane', 'statsLane.json', r.riotVer, r.manaless, next)
    jungle: (next) -> _processLolflavor('Jungle', 'statsJungle.json', r.riotVer, r.manaless, next)
    support: (next) -> _processLolflavor('Support', 'statsSupport.json', r.riotVer, r.manaless, next)
  }, (err, results) ->
    return step(err) if err

    champs = _.merge(results.lane, results.jungle, results.support)
    return step(null, champs)

###*
 * Function Get current Lolflavor version
 * @callback {Function} Callback.
###
getVersion = (step) ->
  hlp.request 'http://www.lolflavor.com/champions/Ahri/Recommended/Ahri_lane_scrape.json', (err, body) ->
    return step(null, "#{T.t('unknown')}") if (err)

    version = body.title.split(' ')[3]
    step(null, version)


###*
 * Export
###
module.exports = {
  aram: aram
  sr: summonersRift
  version: getVersion
}
