# Championify specific error instances used for tracking.

SuperError = require 'super-error'
_ = require 'lodash'

ChampionifyError = SuperError.subclass('ChampionifyError')
errors = {ChampionifyError: ChampionifyError}

error_types = [
  'AjaxError'
  'FileWriteError'
  'OperationalError'
  'UpdateError'
]

_.each error_types, (error_name) ->
  errors[error_name] = ChampionifyError.subclass error_name

module.exports = errors
