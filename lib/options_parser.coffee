remote = require 'remote'
_ = require 'lodash'

_processArgs = (arg) ->
  return _.contains(remote.process.argv, arg)

module.exports = {
  import: -> return _processArgs('--import')
  delete: -> return _processArgs('--delete')
  close: -> return _processArgs('--close')
  autorun: -> return _processArgs('--autorun')
  runnedAsAdmin: () -> return _processArgs('--runnedAsAdmin')
}
