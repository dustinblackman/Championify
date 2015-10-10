try # Avoid conflict when path_manager is loaded from electron.coffee
  remote = require 'remote'
catch e
  # Do Nothing
_ = require 'lodash'

_processArgs = (arg) ->
  return _.contains(remote.process.argv, arg)

module.exports = {
  # Public Use
  import: -> return _processArgs('--import')
  delete: -> return _processArgs('--delete')
  close: -> return _processArgs('--close')
  autorun: -> return _processArgs('--autorun')
  startLeague: -> return _processArgs('--startLeague')
  # Private Use
  runnedAsAdmin: -> return _processArgs('--runnedAsAdmin')
  update: -> return _processArgs('--update')
}
