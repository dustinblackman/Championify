_ = require 'lodash'
async = require 'async'

hlp = require './helpers.coffee'
defaultSchema = require '../data/default.json'

cl = hlp.cl

###*
 * Function Request available ARAM champs from lolflavor.
 * @callback {Function} Callback.
###
requestChamps = (step) ->
  cl 'Downloading ARAM Champs'
  hlp.ajaxRequest 'http://www.lolflavor.com/data/statsARAM.json', (err, body) ->
    if err
      console.log err
      window.undefinedBuilds.push('ARAM: All')
      return step null, []

    champs = _.map body.champions, (item) ->
      return item.name
    champs.sort()

    step null, champs


###*
 * Function Request ARAM item sets from lolflavor.
 * @callback {Function} Callback.
 * @param {Object} Async Auto Object
###
requestData = (step, r) ->
  champs = {}
  aramVer = r.riotVer.split('.').splice(0, 2).join('.')
  async.eachLimit r.aramChamps, 3, (champ, next) ->
    cl 'Processing ARAM: '+champ

    url = _.template('http://www.lolflavor.com/champions/<%- c %>/Recommended/<%- c %>_aram_scrape.json')
    hlp.ajaxRequest url({c: champ}), (err, data) ->
      if err
        console.log err
        window.undefinedBuilds.push('ARAM: '+champ)
        return next null

      data.map = '12'
      data.title = 'ARAM ' + aramVer
      champs[champ] = {}
      champs[champ].aram = data

      next null
  , (err) ->
    return step(err) if err
    step null, champs


###*
 * Function Save ARAM item sets to file
 * @callback {Function} Callback.
 * @param {Object} Async Auto Object
###
saveToFile = (step, r) ->
  cl 'Saving ARAM Item Sets'
  hlp.saveToFile r.aramItemSets, () ->
    hlp.updateProgressBar(2.5)
    step null


###*
 * Export
###
module.exports = {
  requestChamps: requestChamps
  requestData: requestData
  save: saveToFile
}
