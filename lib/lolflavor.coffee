_ = require 'lodash'
async = require 'async'

hlp = require './helpers'
defaultSchema = require '../data/default.json'

cl = hlp.cl

###*
 * Function Request json from available champs
 * @param {String} Type of process (ARAM, Jungle, Support, Lane)
 * @param {String} Name of stats file
 * @callback {Function} Callback.
###
_requestAvailableChamps = (process_name, stats_file, done) ->
  hlp.ajaxRequest 'http://www.lolflavor.com/data/' + stats_file, (err, body) ->
    # Some antivirus' don't like lolfavor. Skip all ARAM builds if so and log error.
    if err
      window.log.warn(err)
      window.undefinedBuilds.push(process_name + ': All')
      return done null, []

    champs = _.map body.champions, (item) -> return item.name
    champs.sort()

    done null, champs

###*
 * Function Request ARAM item sets from lolflavor.
 * @callback {Function} Callback.
 * @param {Object} Async Auto Object
###
_requestData = (champs_names, process_name, riotVer, step) ->
  champs = {}
  riotVer = riotVer.split('.').splice(0, 2).join('.')

  async.eachLimit champs_names, 3, (champ, next) ->
    cl 'Processing ' + process_name + ': ' + champ

    url = _.template('http://www.lolflavor.com/champions/${c}/Recommended/${c}_${p}_scrape.json')
    params = {
      c: champ
      p: process_name.toLowerCase()
    }

    hlp.ajaxRequest url(params), (err, data) ->
      if err
        window.log.warn(err)
        window.undefinedBuilds.push(process_name + ': '+champ)
        return next null

      if process_name == 'ARAM'
        data.map = 'HA'
      if process_name != 'ARAM' and window.cSettings.locksr
        data.map = 'SR'

      data.title = process_name + ' ' + riotVer
      champs[champ] = {}
      champs[champ][process_name.toLowerCase()] = data

      hlp.updateProgressBar(30 / champs_names.length) if process_name != 'ARAM'
      next null
  , (err) ->
    return step(err) if err
    step null, champs


_processLolflavor = (process_name, stats_file, riotVer, step) ->
  cl 'Downloading ' + process_name + ' Champs'
  _requestAvailableChamps process_name, stats_file, (err, champ_names) ->
    return step(err) if err

    _requestData(champ_names, process_name, riotVer, step)


###*
 * Function Request available type champs from lolflavor.
 * @callback {Function} Callback.
###
requestAramChamps = (step, r) ->
  _processLolflavor('ARAM', 'statsARAM.json', r.riotVer, step)

requestLaneChamps = (step, r) ->
  _processLolflavor('Lane', 'statsLane.json', r.riotVer, step)

requestJungleChamps = (step, r) ->
  _processLolflavor('Jungle', 'statsJungle.json', r.riotVer, step)

requestSupportChamps = (step, r) ->
  _processLolflavor('Support', 'statsSupport.json', r.riotVer, step)


###*
 * Function Helper to request item sets for summoners rift
 * @callback {Function} Callback.
###
summonersRift = (step, r) ->
  async.series {
    lane: (next) -> requestLaneChamps(next, r)
    jungle: (next) -> requestJungleChamps(next, r)
    support: (next) -> requestSupportChamps(next, r)
  }, (err, results) ->
    return step(err) if err

    champs = _.merge(results.lane, results.jungle, results.support)
    return step(null, champs)


###*
 * Export
###
module.exports = {
  aram: requestAramChamps
  sr: summonersRift
}
