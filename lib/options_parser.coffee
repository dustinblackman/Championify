try # Avoid conflict when path_manager is loaded from electron.coffee
  remote = require 'remote'
catch e
_ = require 'lodash'

_processArgs = (arg) ->
  return _.contains(remote.process.argv, arg)

module.exports = {
  import: -> return _processArgs('--import')
  delete: -> return _processArgs('--delete')
  close: -> return _processArgs('--close')
  autorun: -> return _processArgs('--autorun')
  runnedAsAdmin: -> return _processArgs('--runnedAsAdmin')
  startLeague: -> return _processArgs('--startLeague')
}
