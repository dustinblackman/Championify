cErrors = require './errors'
path = require 'path'
_ = require 'lodash'

module.exports = class Translate
  constructor: (locale) ->
    @locale = locale
    @phrases = require path.join(__dirname, "../i18n/#{locale}.json")

    throw new cErrors.OperationalError("#{lang} does not exist in i18n folder") if !@phrases

  # Translate
  t: (phrase) ->
    phrase = phrase.toLowerCase()
    translated_phrase = @phrases[phrase]
    throw new cErrors.TranslationError("Phrase does not exist for #{@locale}: #{phrase}") if !translated_phrase
    return translated_phrase

  # To set flag class for jade template
  flag: ->
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

  # Merge in new translations to phrases (like Champ names)
  merge: (translations) ->
    translations = _.mapKeys translations, (value, key) -> return key.toLowerCase()
    @phrases = _.merge(@phrases, translations)

  # Convert locale for Riot API
  riotLocale: ->
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
