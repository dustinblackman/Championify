cErrors = require './errors'
path = require 'path'

Translate = (locale) ->
  @locale = locale
  @phrases = require path.join(__dirname, "../i18n/#{locale}.json")

  throw new cErrors.OperationalError("#{lang} does not exist in i18n folder") if !@phrases

# Translate
Translate::t = (phrase) ->
  translated_phrase = @phrases[phrase]
  throw new cErrors.TranslationError("Phrase does not exist for #{@locale}: #{phrase}") if !translated_phrase
  return translated_phrase

# To set flag class for jade template
Translate::flag = ->
  flag = ''

  if @locale == 'en'
    flag = 'gb'
  else if @locale == 'zh-CN' or @locale == 'zh-TW'
    flag = 'cn'
  else if @locale == 'cs'
    flag = 'cz'
  else if @locale == 'el'
    flag = 'gr'
  else if @locale == 'he'
    flag = 'il'
  else if @locale == 'ja'
    flag = 'jp'
  else if @locale == 'ko'
    flag = 'kr'
  else if @locale == 'ms'
    flag = 'my'
  else if @locale == 'vi'
    flag = 'vn'
  else
    flag = @locale

  return flag

module.exports = Translate
