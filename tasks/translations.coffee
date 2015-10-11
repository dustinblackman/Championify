argv = require('yargs').argv
async = require 'async'
colors = require 'colors'
crypto = require 'crypto'
fs = require 'fs-extra'
glob = require 'glob'
gulp = require 'gulp'
GT = require('google-translate')(process.env.GOOGLE_TRANSLATE_API)
path = require 'path'
prompt = require 'prompt'
request = require 'request'
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

    # Translate each phrase.
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

# Download translations from Transifex. `gulp transifex:download --lang th`
gulp.task 'transifex:download', (cb) ->
  lang = argv.lang or argv.language
  return cb(new Error('You need to define a locale to download')) if !lang

  url = "https://#{process.env.TRANSIFEX_KEY}@www.transifex.com/api/2/project/championify/resource/english-source/translation/#{lang}/?mode=default&file"
  request url, (err, res, body) ->
    return cb(err) if err

    previous_translations = JSON.parse fs.readFileSync("./i18n/#{lang}.json")
    translations = _.merge(previous_translations, JSON.parse(body))

    fs.writeFile "./i18n/#{lang}.json", JSON.stringify(translations, null, 2), {encoding: 'utf8'}, (err) ->
      console.log "Wrote ./i18n/#{lang}.json" if !err
      return cb(err)

# Uploads all translations except English.
gulp.task 'transifex:upload', (cb) ->
  async.eachLimit glob.sync('./i18n/*.json'), 5, (translation_path, next) ->
    lang = path.basename(translation_path).replace('.json', '')
    return next() if _.contains(['_source', 'en'], lang)

    console.log "Uploading #{lang}..."
    data = JSON.parse fs.readFileSync(path.join(__dirname, '..', translation_path))
    options = {
      url: "https://#{process.env.TRANSIFEX_KEY}@www.transifex.com/api/2/project/championify/resource/english-source/translation/#{lang}/"
      method: 'PUT'
      headers: {'Content-Type': 'application/json'}
      form: {content: data}
    }

    request options, (err, res, body) ->
      console.log body
      next(err)

  , cb

# Downloads all translations from Transifex and shows changed items in a table for review.
gulp.task 'transifex:review', (cb) ->
  to_review = {}
  all_translations = {}
  source = JSON.parse fs.readFileSync('./i18n/_source.json')

  async.series [
    (step) ->
      async.each supported_languages, (lang, next) ->
        return next() if lang == 'en'

        previous_translations = JSON.parse fs.readFileSync("./i18n/#{lang}.json")
        url = "https://#{process.env.TRANSIFEX_KEY}@www.transifex.com/api/2/project/championify/resource/english-source/translation/#{lang}/?mode=default&file"
        request url, (err, res, body) ->
          return next(err) if err

          new_translations = JSON.parse body
          all_translations[lang] = new_translations

          _.each new_translations, (translation, key) ->
            if translation != previous_translations[key]
              to_review[lang] = {} if !to_review[lang]
              to_review[lang][key] = {
                translation: translation
                original: previous_translations[key]
              }

          return next()
      , (err) ->
        return step(err) if (err)
        return step(null)

    (step) ->
      async.eachSeries _.keys(to_review), (lang, next) ->
        async.eachLimit _.keys(to_review[lang]), 5, (trans_key, nextTrans) ->
          GT.translate to_review[lang][trans_key].translation, lang, 'en', (err, result) ->
            return nextTrans(err) if (err)

            to_review[lang][trans_key].reverse = result.translatedText
            return nextTrans()
        , (err) ->
          return next(err) if err

          _.each to_review[lang], (val, key) ->
            console.log("Lang       | #{lang.bold.white}")
            console.log("Key        | #{key.bold.red}")
            console.log("English    | #{source[key].msg.bold.blue}")
            console.log("Reverse    | #{val.reverse.bold.green}")
            console.log("Old Trans  | #{val.original.bold.yellow}")
            console.log("New Trans  | #{val.translation.bold.magenta}")
            console.log('------------------------------------'.bold.white)

          prompt.start()
          params = {
            properties: {
              answer: {
                message: 'Would you like to save these translations? [y/n]'
                required: true
              }
            }
          }
          prompt.get params, (err, results) ->
            return next(err) if err

            if results.answer == 'y'
              previous_translations = JSON.parse fs.readFileSync("./i18n/#{lang}.json")
              translations = _.merge(previous_translations, all_translations[lang])

              fs.writeFile "./i18n/#{lang}.json", JSON.stringify(translations, null, 2), {encoding: 'utf8'}, next
            else
              return next()

      , (err) ->
        return step(err) if err

  ], cb
