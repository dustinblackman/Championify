cErrors = require './errors'
path = require 'path'

Translate = (lang) ->
  @lang = lang
  @phrases = require path.join(__dirname, "../i18n/#{lang}.json")

  throw new cErrors.OperationalError("#{lang} does not exist in i18n folder") if !@phrases

# Translate
Translate::t = (phrase) ->
  translated_phrase = @phrases[phrase]
  throw new cErrors.TranslationError("Phrase does not exist for #{@lang}: #{phrase}") if !translated_phrase
  return translated_phrase

Translate::current = ->
  return @lang

Translate::all = ->
  return @phrases

# To set flag class for jade template
Translate::flag = ->
  flag = ''

  if @lang == 'en'
    flag = 'gb'
  else if @lang == 'zh-CN' or @lang == 'zh-TW'
    flag = 'cn'
  else if @lang == 'cs'
    flag = 'cz'
  else if @lang == 'el'
    flag = 'gr'
  else if @lang == 'ko'
    flag = 'kr'
  else if @lang == 'ms'
    flag = 'my'
  else if @lang == 'vi'
    flag = 'vn'
  else
    flag = @lang

  return flag

module.exports = Translate
