async = require 'async'
fs = require 'fs-extra'
gulp = require 'gulp'
GT = require('google-translate')(process.env.GOOGLE_TRANSLATE_API)
path = require 'path'
_ = require 'lodash'

supported_languages = [
  'bg' # Bulgarian
  'cs' # Czech
  'de' # German
  'el' # Greek
  'en' # English
  'es' # Spanish
  'fr' # French
  'he' # Hebrew
  'hu' # Hungarian
  'id' # Indonesian
  'it' # Italian
  'ja' # Japanese
  'ko' # Korean
  'ms' # Malay
  'nl' # Dutch
  'pl' # Polish
  'pt' # Portuguese
  'ro' # Romanian
  'ru' # Russian
  'th' # Thai
  'tr' # Turkish
  'vi' # Vietnamese
  'zh-CN' # Chinese Simplified
  'zh-TW' # Chinese Traditional
]


gulp.task 'translate', (cb) ->
  _source = require '../i18n/_source.json'

  # Process each language syncronously
  async.eachSeries supported_languages, (lang, step) ->
    console.log "Processing: #{lang}"

    # Load up the locale files. If it doesn't exist than empty object.
    loc_path = path.join(__dirname, "../i18n/#{lang}.json")
    if fs.existsSync(loc_path)
      loc = require loc_path
    else
      loc = {}

    # Translate each phrase. # TODO: Possibly up concurrency if Google's API will allow it.
    async.eachLimit _.keys(_source), 10, (phrase_key, next) ->
      # If it's already been translated, and were not re-translating it when _source is false, then skip.
      return next() if loc[phrase_key] and _source[phrase_key]?.done

      msg = _source[phrase_key]?.msg or _source[phrase_key]

      # Phrases are by default in English, no need to translate them.
      if lang == 'en'
        loc[phrase_key] = msg
        return next()

      # Translate
      GT.translate msg, 'en', lang, (err, result) ->
        return next(err) if err
        # If the key is the same, sometimes google translate doens't like how letters are capitialized.
        if _source[phrase_key].msg == result.translatedText
          GT.translate _.capitalize(msg.toLowerCase()), 'en', lang, (err, result) ->
            return next(err) if err
            loc[phrase_key] = result.translatedText
            next()
        else
          loc[phrase_key] = result.translatedText
          next()

    , (err) ->
      # Sort and save locale
      keys = _.keys(loc)
      keys.sort()
      new_obj = {}

      _.each keys, (key) ->
        new_obj[key] = loc[key]

      json = JSON.stringify(new_obj, null, 2)
      fs.writeFile path.join(__dirname, "../i18n/#{lang}.json"), json, {encoding: 'utf8'}, (f_err) ->
        console.log if (f_err)
        step(err)

  , (err) ->
    if !err
      # Sort and save source
      source_keys = _.keys(_source)
      source_keys.sort()
      new_source = {}
      _.each source_keys, (key) ->
        if _.isString(_source[key])
          new_source[key] = {
            msg: _source[key]
            done: true
          }
        else
          new_source[key] = _source[key]
          new_source[key].done = true

      json = JSON.stringify(new_source, null, 2)
      fs.writeFile path.join(__dirname, '../i18n/_source.json'), json, {encoding: 'utf8'}, (err) ->
        cb(err)
    else
      cb(err)
