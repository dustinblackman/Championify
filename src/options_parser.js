import { remote } from 'electron';
import R from 'ramda';


function _processArgs(arg) {
  return R.contains(arg, remote.process.argv);
}

export default {
  /**
   * Checks if '--import' is in process arguments
   * @returns {Boolean}
   */
  import: function() {
    return _processArgs('--import');
  },
  /**
   * Checks if '--delete' is in process arguments
   * @returns {Boolean}
   */
  delete: function() {
    return _processArgs('--delete');
  },
  /**
   * Checks if '--close' is in process arguments
   * @returns {Boolean}
   */
  close: function() {
    return _processArgs('--close');
  },
  /**
   * Checks if '--autorun' is in process arguments
   * @returns {Boolean}
   */
  autorun: function() {
    return _processArgs('--autorun');
  },
  /**
   * Checks if '--start-league' is in process arguments
   * @returns {Boolean}
   */
  startLeague: function() {
    return _processArgs('--start-league');
  },
  /**
   * Checks if '--runned-as-admin' is in process arguments
   * @returns {Boolean}
   */
  runnedAsAdmin: function() {
    return _processArgs('--runned-as-admin');
  },
  /**
   * Checks if '--update' is in process arguments
   * @returns {Boolean}
   */
  update: function() {
    return _processArgs('--update');
  }
};
