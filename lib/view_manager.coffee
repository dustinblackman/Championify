###*
 * Function To change all views with the same transitions.
 * @param {string} name of view
 * @param {function} function to run before loading in new view.
###
_viewChanger = (view, process) ->
  if !process
    process = (done) -> done()

  $('#view').transition {
    animation: 'fade up'
    onComplete: ->
      $('#view').load 'views/' + view + '.html', ->
        process ->
          $('#view').transition('browse')
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
 * Function Change to complete update with transitions.
###
updateView = ->
  _viewChanger 'update'

module.exports = {
  complete: completeView
  error: errorView
  update: updateView
}
