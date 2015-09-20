# This inits the global properties within electron to prevent any errors.

champions = require './fixtures/champions.json'
Translate = require '../lib/translate'
sinon = require 'sinon'
_ = require 'lodash'

window.cSettings = {}
window.T = new Translate('en')
window.Log = {
  error: console.error
  info: sinon.stub()
  warn: console.log
}
window.undefinedBuilds = []

window.$ = sinon.stub()
$.withArgs('#cl_progress').returns({prepend: -> return})

translated_champs = _.mapValues champions.data, (data) -> return data.name
T.merge(translated_champs)
