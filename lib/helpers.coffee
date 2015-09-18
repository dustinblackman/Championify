async = require 'async'
path = require 'path'
remote = require 'remote'
request = require 'request'
_ = require 'lodash'

cErrors = require './errors'
pkg = require '../package.json'
prebuilts = require '../data/prebuilts.json'

module.exports = {

  ###*
   * Function Preset ajax request.
   * @param {String} URL
   * @callback {Function} Callback
  ###
  request: (url, done) ->
    async.retry 3, (step) ->
      options = {
        timeout: 10000
        url: url
      }
      request options, (err, res, body) ->
        return step(err) if err

        if _.contains(res.headers?['content-type'], 'text/json') or _.contains(url, '.json')
          try
            body = JSON.parse(body)
          catch e
            # Do nothing
        step null, body

    , (err, results) ->
      return done(err) if err
      return done null, results


  ###*
   * Function Adds % to string.
   * @param {String} Text.
   * @returns {String} Formated String.
  ###
  wins: (text) ->
    return "#{text}%"


  ###*
   * Splice version number to two.
   * @param {String} Version number
  ###
  spliceVersion: (version) ->
    return version.split('.').splice(0, 2).join('.')


  ###*
   * Function Pretty console log, as well as updates the progress div on interface
   * @param {String} Console Message.
  ###
  cl: (text, level='info') ->
    Log[level](text)
    $('#cl_progress').prepend("<span>#{text}</span><br />")


  ###*
   * Function Updates the progress bar on the interface.
   * @param {Number} Increment progress bar.
  ###
  updateProgressBar: (incr) ->
    @incr = 0 if !@incr or incr == true
    @incr += incr

    @incrUIProgressBar('itemsets_progress_bar', @incr)
    if @incr >= 100
      remote.getCurrentWindow().setProgressBar(-1)
    else
      remote.getCurrentWindow().setProgressBar(@incr / 100)


  incrUIProgressBar: (id, incr) ->
    # Bug with Semantic UI progress function that makes 0 be set constantly.
    # This is an easy work around.
    floored = Math.floor(incr)
    floored = 100 if floored > 100
    $('#' + id).attr('data-percent', floored)
    $('#' + id).find('.bar').css('width', "#{floored}%")
    $('#' + id).find('.progress').text("#{floored}%")


  ###*
   * Function Reusable function for generating Trinkets and Consumables.
   * @param {Array} Array of blocks for item sets
   * @param {String} System name of champ
   * @param {Array} List of manaless champ names
   * @param {Object} Formatted skill priorities
  ###
  trinksCon: (builds, champ, manaless, skills={}) ->
    # Consumables
    if window.cSettings.consumables
      # If champ has no mana, remove mana pot from consumables
      consumables = _.clone(prebuilts.consumables, true)
      consumables.splice(1, 1) if _.contains(manaless, champ)

      consumables_title = "#{T.t('consumables')}"
      if skills.mostFreq
        consumables_title += " | #{T.t('frequent')}: #{skills.mostFreq}"

      consumables_block = {
        items: consumables
        type: consumables_title
      }

      if window.cSettings.consumables_position == 'beginning'
        builds.unshift consumables_block
      else
        builds.push consumables_block

    # Trinkets
    if window.cSettings.trinkets
      trinkets_title = "#{T.t('trinkets')}"
      if skills.highestWin
        trinkets_title += " | #{T.t('wins')}: #{skills.highestWin}"

      trinkets_block = {
        items: prebuilts.trinketUpgrades
        type: trinkets_title
      }

      if window.cSettings.trinkets_position == 'beginning'
        builds.unshift trinkets_block
      else
        builds.push trinkets_block

    return builds
}
