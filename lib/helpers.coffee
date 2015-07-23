_ = require 'lodash'
async = require 'async'
path = require 'path'
https = require('follow-redirects').https

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
   * Function to download files.
   * @param {String} URL of download
   * @param {String} Local Destination
   * @callback {Function} Callback
  ###
  downloadFile: (url, dest, cb) ->
    try
      file = fs.createWriteStream(dest)
    catch e
      return cb(new cErrors.UpdateError('Can\'t write update-asar').causedBy(e))

    https.get url, (res) ->
      res.pipe file
      file.on 'error', (err) ->
        return cb(err)
      file.on 'finish', ->
        file.close cb


  ###*
   * Function Adds % to string.
   * @param {String} Text.
   * @returns {String} Formated String.
  ###
  wins: (text) ->
    return text.toString() + '%'


  ###*
   * Function Compares version numbers. Returns 1 if left is highest, -1 if right, 0 if the same.
   * @param {String} First (Left) version number.
   * @param {String} Second (Right) version number.
   * @returns {Number}.
  ###
  versionCompare: (left, right) ->
    if typeof left + typeof right != 'stringstring'
      return false

    a = left.split('.')
    b = right.split('.')
    i = 0
    len = Math.max(a.length, b.length)

    while i < len
      if a[i] and !b[i] and parseInt(a[i]) > 0 or parseInt(a[i]) > parseInt(b[i])
        return 1
      else if b[i] and !a[i] and parseInt(b[i]) > 0 or parseInt(a[i]) < parseInt(b[i])
        return -1
      i++

    return 0


  ###*
   * Function Pretty console log, as well as updates the progress div on interface
   * @param {String} Console Message.
  ###
  cl: (text, level) ->
    level = level || 'info'
    window.log[level](text)

    $('#cl-progress').prepend('<span>'+text+'</span><br />')


  ###*
   * Function Updates the progress bar on the interface.
   * @param {Number} Increment progress bar.
  ###
  updateProgressBar: (incr) ->
    this.incr = 0 if !this.incr
    this.incr += incr

    # Bug with Semantic UI progress function that makes 0 be set constantly.
    # This is an easy work around.
    floored = Math.floor(this.incr)
    floored = 100 if floored > 100
    $('#progress_bar').attr('data-percent', floored)
    $('#progress_bar').find('.bar').css('width', floored+'%')
    $('#progress_bar').find('.progress').text(floored+'%')

    if this.incr >= 100
      window.remote.getCurrentWindow().setProgressBar(-1)
    else
      window.remote.getCurrentWindow().setProgressBar(this.incr / 100)


  # TODO: This is a messy function. Clean it up with Lodash, possibly.
  ###*
   * Function Saves all compiled item sets to file, creating paths included.
   * @callback {Function} Callback.
  ###
  saveToFile: (champData, step) ->
    async.each _.keys(champData), (champ, next) ->
      async.each _.keys(champData[champ]), (position, nextPosition) ->
        toFileData = JSON.stringify(champData[champ][position], null, 4)
        folder_path = path.join(window.item_set_path, champ, 'Recommended')

        mkdirp folder_path, (err) ->
          window.log.warn(err) if err

          file_path = path.join(window.item_set_path, champ, 'Recommended/CGG_'+champ+'_'+position+'.json')
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
   * Function Check version of Github package.json and local.
   * @callback {Function} Callback.
  ###
  checkVer: (step) ->
    self = this

    url = 'https://raw.githubusercontent.com/dustinblackman/Championify/master/package.json'
    self.ajaxRequest url, (err, data) ->
      return window.endSession(new cErrors.AjaxError('Can\'t access Github package.json').causedBy(err)) if err

      data = JSON.parse(data)
      if self.versionCompare(data.version, pkg.version) == 1
        step null, true, data.version
      else
        step null, false

}
