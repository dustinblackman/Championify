# Championify specific error instances used for tracking.

SuperError = require 'super-error'
_ = require 'lodash'
os = require 'os'

ChampionifyError = SuperError.subclass('ChampionifyError')
errors = {ChampionifyError: ChampionifyError}

error_types = [
  'AjaxError'
  'FileWriteError'
  'OperationalError'
  'UpdateError'
]

_.each error_types, (error_name) ->
  errors[error_name] = ChampionifyError.subclass error_name, ->
    @ua = [os.platform(), os.release()].join(' ')

module.exports = errors
