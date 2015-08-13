async = require 'async'
path = require 'path'
remote = require 'remote'
_ = require 'lodash'

cErrors = require './errors'
pkg = require '../package.json'

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
    this.incr = 0 if !this.incr or incr == true
    this.incr += incr

    this.incrUIProgressBar('itemsets_progress_bar', this.incr)
    if this.incr >= 100
      remote.getCurrentWindow().setProgressBar(-1)
    else
      remote.getCurrentWindow().setProgressBar(this.incr / 100)


  incrUIProgressBar: (id, incr) ->
    # Bug with Semantic UI progress function that makes 0 be set constantly.
    # This is an easy work around.
    floored = Math.floor(incr)
    floored = 100 if floored > 100
    $('#' + id).attr('data-percent', floored)
    $('#' + id).find('.bar').css('width', floored + '%')
    $('#' + id).find('.progress').text(floored + '%')
}
