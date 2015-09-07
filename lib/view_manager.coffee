jade = require 'jade'
path = require 'path'

championify = require './championify'
championgg = require './sources/championgg'
hlp = require './helpers'
lolflavor = require './sources/lolflavor'
preferences = require './preferences'
pkg = require '../package.json'
sourceUIManager = require './source_ui_manager'

###*
 * Function To change all views with the same transitions.
 * @param {string} name of view
 * @param {function} function to run before loading in new view.
###
_viewChanger = (view, process, transition='browse') ->
  if !process
    process = (done) -> done()

  html = jade.renderFile path.resolve(path.join(__dirname, "../views/#{view}.jade"))

  $('#view').transition {
    animation: 'fade up'
    onComplete: ->
      $('#view').html(html).promise().done ->
        process -> $('#view').transition(transition)
  }


###*
 * Function Change to complete view with transitions.
###
completeView = ->
  loadUnavailable = (done) ->
    if window.undefinedBuilds.length == 0
      $('#not_available_log').append('<span>Nothing! You get all the builds!</span><br />')
    else
      _.each window.undefinedBuilds, (item) ->
        $('#not_available_log').append("<span>#{item}</span><br />")
    done()

  _viewChanger 'complete', loadUnavailable


###*
 * Function Change to error view with transitions.
###
errorView = ->
  _viewChanger 'error'


###*
 * Function Change to complete view with transitions.
###
updateView = ->
  _viewChanger 'update'


###*
 * Function Change to main view with reverse transitions.
###
mainViewBack = ->
  resetMain = (next) ->
    $('#cl_progress').html('')
    $('.submit_btns').removeClass('hidden')
    $('.status').attr('class', 'status hidden')
    _initSettings()
    next()

  _viewChanger 'main', resetMain, 'fly right'


###*
 * Function Initial view with settings
###
_initSettings = ->
  if process.platform == 'darwin'
    window.browse_title = 'Select League of Legends.app'
  else
    window.browse_title = 'Select League of Legends directory'

  $('#browse_title').text(window.browse_title)
  $('.championify_version > span').text("v#{pkg.version}")

  $('.options_tooltip').popup()
  $('.ui.dropdown').dropdown()

  $('#sr_source').dropdown {
    action: 'activate'
    onChange: (value) ->
      if value == 'lolflavor'
        sourceUIManager.lolflavor()
      else
        sourceUIManager.championgg()
  }

  # Load versions of LoL and sources
  championify.version (err, version) ->
    $('#lol_version').text(hlp.spliceVersion(version))
  championgg.version (err, version) ->
    $('#championgg_version').text(version)
  lolflavor.version (err, version) ->
    $('#lolflavor_version').text(version)

  # Load preferences
  preferences.load()


init = (done) ->
  options = {platform: process.platform}
  html = jade.renderFile path.resolve(path.join(__dirname, '../views/index.jade')), options
  $('#body').replaceWith(html).promise().done ->
    _initSettings()
    done()


module.exports = {
  complete: completeView
  error: errorView
  update: updateView
  mainBack: mainViewBack
  init: init
}
