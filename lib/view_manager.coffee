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

  $('#view').transition {
    animation: 'fade up'
    onComplete: ->
      $('#view').load 'views/' + view + '.html', ->
        process ->
          $('#view').transition(transition)
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
        $('#not_available_log').append('<span>' + item + '</span><br />')
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
# TODO: This is why I should be using React...
_initSettings = ->
  if process.platform == 'darwin'
    window.browse_title = 'Select League of Legends.app'
    $('.osx_buttons').removeClass('hidden')
  else
    window.browse_title = 'Select League of Legends directory'
    $('.win_buttons').removeClass('hidden')

  $('#browse_title').text(window.browse_title)
  $('.version > span').text('v'+pkg.version)

  $(".options_tooltip").popup()
  $('.ui.dropdown').dropdown()

  $('#sr_source').dropdown {
    action: 'activate',
    onChange: (value) ->
      if value == 'lolflavor'
        sourceUIManager.lolflavor()
      else
        sourceUIManager.championgg()
  }

  preferences.load()


init = (done) ->
  $('#view').load 'views/main.html', ->
    _initSettings()
    done()


module.exports = {
  complete: completeView
  error: errorView
  update: updateView
  mainBack: mainViewBack
  init: init
}
