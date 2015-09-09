jade = require 'jade'
path = require 'path'

championify = require './championify'
championgg = require './sources/championgg'
hlp = require './helpers'
lolflavor = require './sources/lolflavor'
preferences = require './preferences'
pkg = require '../package.json'
sourceUIManager = require './source_ui_manager'
Translate = require './translate'

###*
 * Function To change all views with the same transitions.
 * @param {string} name of view
 * @param {function} function to run before loading in new view.
###
_viewChanger = (view, process, options={}) ->
  nub = (done) -> done()

  default_options = {
    transition: 'browse'
    div_id: 'view'
    jade: {}
  }

  if !process
    options = {}
    process = nub

  if !_.isFunction(process)
    options = process
    process = nub

  options = _.merge _.clone(default_options), options

  $("##{options.div_id}").transition {
    animation: 'fade up'
    onComplete: ->
      html = jade.renderFile path.resolve(path.join(__dirname, "../views/#{view}.jade")), default_options.jade
      $("##{options.div_id}").html(html).promise().done ->
        process -> $("##{options.div_id}").transition(options.transition)
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

  _viewChanger 'main', resetMain, {transition: 'fly right'}


###*
 * Function Initial view with settings
###
_initSettings = ->
  if process.platform == 'darwin'
    window.browse_title = "#{T.t('select')} League of Legends.app"
  else
    window.browse_title = "#{T.t('select')} League of Legends #{T.t('directory')}"

  $('#browse_title').text(window.browse_title)
  $('.championify_version > span').text("v#{pkg.version}")

  $('#locale_flag').attr('class', "#{T.flag()} flag")
  $('#locals_select').find(".item[data-value='#{T.locale}']").addClass('active')

  # Remove any popups that may of stuck during view changes.
  $('.ui.popup.top.left.transition.visible').remove()

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

  $('#locals_select').dropdown {
    action: 'activate'
    onChange: (value, text, $selector) ->
      reset = (done) ->
        _initSettings()
        done()

      local = $selector.attr('data-value')
      window.T = new Translate(local)
      _viewChanger '_view', reset, {
        div_id: 'parent_view'
        transition: 'fade'
        jade: {platform: process.platform}
      }
  }

  # Load versions of LoL and sources
  championify.version (err, version) ->
    return if err
    $('#lol_version').text(hlp.spliceVersion(version))
  championgg.version (err, version) ->
    return if err
    $('#championgg_version').text(version)
  lolflavor.version (err, version) ->
    return if err
    $('#lolflavor_version').text(version)

  # Load preferences
  preferences.set(preferences.load())


init = (done) ->
  options = {platform: process.platform}

  html = jade.renderFile path.resolve(path.join(__dirname, '../views/index.jade')), options
  $('#body').html(html).promise().done ->
    _initSettings()
    done()


module.exports = {
  complete: completeView
  error: errorView
  update: updateView
  mainBack: mainViewBack
  init: init
}
