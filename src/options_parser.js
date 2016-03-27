import remote from 'remote';
import _ from 'lodash';


function _processArgs(arg) {
  return _.contains(remote.process.argv, arg);
}

export default {
  import: function() {
    return _processArgs('--import');
  },
  delete: function() {
    return _processArgs('--delete');
  },
  close: function() {
    return _processArgs('--close');
  },
  autorun: function() {
    return _processArgs('--autorun');
  },
  startLeague: function() {
    return _processArgs('--startLeague');
  },
  runnedAsAdmin: function() {
    return _processArgs('--runnedAsAdmin');
  },
  update: function() {
    return _processArgs('--update');
  }
};
