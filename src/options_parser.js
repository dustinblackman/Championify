import remote from 'remote';
import R from 'ramda';


function _processArgs(arg) {
  return R.contains(arg, remote.process.argv);
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
