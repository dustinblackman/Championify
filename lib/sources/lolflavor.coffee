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
_requestData = (champs_names, process_name, riotVer, manaless, step) ->
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
  cl 'Downloading ' + process_name + ' Champs'
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
 * Export
###
module.exports = {
  aram: aram
  sr: summonersRift
}
