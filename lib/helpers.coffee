async = require 'async'
path = require 'path'
remote = require 'remote'
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
  ajaxRequest: (url, done) ->
    async.retry 3, (step) ->
      $.ajax({url: url, timeout: 10000})
        .fail (err) ->
          return step err
        .done (body) ->
          step null, body

    , (err, results) ->
      if err
        window.log.error(err)
        return done(new Error(err))

      return done null, results


  ###*
   * Function Adds % to string.
   * @param {String} Text.
   * @returns {String} Formated String.
  ###
  wins: (text) ->
    return text.toString() + '%'


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
    window.log[level](text)
    $('#cl-progress').prepend('<span>'+text+'</span><br />')


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
    $('#' + id).find('.bar').css('width', floored + '%')
    $('#' + id).find('.progress').text(floored + '%')


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

      consumables_title = 'Consumables'
      if skills.mostFreq
        consumables_title += ' | Frequent: ' + skills.mostFreq

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
      trinkets_title = 'Trinkets'
      if skills.highestWin
        trinkets_title += ' | Wins: ' + skills.highestWin

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
