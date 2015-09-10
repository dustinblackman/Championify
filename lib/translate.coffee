cErrors = require './errors'
path = require 'path'

Translate = (locale) ->
  @locale = locale
  @phrases = require path.join(__dirname, "../i18n/#{locale}.json")

  throw new cErrors.OperationalError("#{lang} does not exist in i18n folder") if !@phrases

# Translate
Translate::t = (phrase) ->
  phrase = phrase.toLowerCase()
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

# Set champ name translations
Translate::setChamps = (champs) ->
  @champs = champs

# Get champ name translation
Translate::champ = (champ) ->
  throw new cErrors.TranslationError('Champs has not been defined') if !@champs
  return @champs[champ]

# Convert locale for Riot API
Translate::riotLocale = ->
  riot_locales = {
    bg: 'bg_BG'
    cs: 'cs_CZ'
    de: 'de_DE'
    el: 'el_GR'
    en: 'en_US'
    es: 'es_ES'
    fr: 'fr_FR'
    hu: 'hu_HU'
    id: 'id_ID'
    it: 'it_IT'
    ja: 'ja_JP'
    ko: 'ko_KR'
    nl: 'nl_NL'
    ms: 'ms_MY'
    pl: 'pl_PL'
    pt: 'pt_PT'
    ro: 'ro_RO'
    ru: 'ru_RU'
    th: 'th_TH'
    tr: 'tr_TR'
    vi: 'vn_VN'
    'zh-CN': 'zh_CN'
    'zh-TW': 'zh_CN'
  }

  return riot_locales[@locale] or 'en_US'


module.exports = Translate
