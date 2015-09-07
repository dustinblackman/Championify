cErrors = require './errors'
path = require 'path'

Translate = (lang) ->
  @lang = lang
  @phrases = require path.join(__dirname, "../i18n/#{lang}.json")

  throw new cErrors.OperationalError("#{lang} does not exist in i18n folder") if !@phrases

Translate::translate = (phrase) ->
  translated_phrase = @phrases[phrase]
  throw new cErrors.TranslationError("Phrase does not exist for #{@lang}: #{phrase}") if !translated_phrase
  return translated_phrase

Translate::current = ->
  return @lang

Translate::all = ->
  return @phrases

module.exports = Translate
