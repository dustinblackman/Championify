cErrors = require './errors'
fs = require 'fs'
path = require 'path'
_ = require 'lodash'


# Some languages aren't supported in the league client due to lack of character support.
# Default to english if in this list, but keep the ui in the native language.
ingame_locals = [
  'ar'
  'ja'
]

module.exports = class Translate
  constructor: (locale) ->
    @locale = locale

    i18n_path = path.join(__dirname, "../i18n/#{locale}.json")
    throw new cErrors.OperationalError("#{locale} does not exist in i18n folder") if !fs.existsSync(i18n_path)
    @phrases = require i18n_path
    @english_phrases = require path.join(__dirname, '../i18n/en.json')

  # Translate
  t: (phrase, ingame) ->
    phrase = phrase.toLowerCase()
    translated_phrase = @phrases[phrase]

    if ingame and _.includes(ingame_locals, @locale)
      translated_phrase = @english_phrases[phrase]

    throw new cErrors.TranslationError("Phrase does not exist for #{@locale}: #{phrase}") if !translated_phrase
    return translated_phrase

  # To set flag class for jade template
  flag: ->
    flags = {
      en: 'gb'
      'zh-CN': 'cn'
      'zh-TW': 'tw'
      cs: 'cz'
      el: 'gr'
      he: 'il'
      ja: 'jp'
      ko: 'kr'
      ms: 'my'
      vi: 'vn'
      'pt-BR': 'br'
      bs: 'ba'
      ca: 'es'
      da: 'dk'
      ka: 'ge'
      sr: 'cs'
      sl: 'si'
      sv: 'se'
      ar: 'eg'
    }

    return flags[@locale] or @locale

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
      pt: 'pt_BR'
      'pt-BR': 'pt_BR'
      ro: 'ro_RO'
      ru: 'ru_RU'
      th: 'th_TH'
      tr: 'tr_TR'
      vi: 'vn_VN'
      'zh-CN': 'zh_CN'
      'zh-TW': 'zh_TW'
    }

    return riot_locales[@locale] or 'en_US'
