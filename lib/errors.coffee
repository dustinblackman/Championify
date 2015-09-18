# Championify specific error instances used for tracking.

os = require 'os'
SuperError = require 'super-error'
_ = require 'lodash'


ChampionifyError = SuperError.subclass('ChampionifyError')
errors = {ChampionifyError: ChampionifyError}

error_types = [
  'FileWriteError'
  'OperationalError'
  'RequestError'
  'TranslationError'
  'UncaughtException'
  'UpdateError'
]

_.each error_types, (error_name) ->
  errors[error_name] = ChampionifyError.subclass error_name, ->
    @type = error_name
    @ua = [os.platform(), os.release()].join(' ')
    @locale = T.locale or GLOBAL.T.locale

module.exports = errors
