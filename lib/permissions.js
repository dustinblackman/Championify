import async from 'async';
import { exec } from 'child_process';
import fs from 'fs-extra';
import glob from 'glob';
import mkdirp from 'mkdirp';
import path from 'path';
import _ from 'lodash';

import cErrors from './errors';
import optionsParser from './options_parser';
import preferences from './preferences';


/**
 * Function If platform is Windows, check if we can write to the user selected directory, and restart as admin if not.
 * @callback {Function} Callback
 */

function championTest(step) {
  if (process.platform === 'win32' && !optionsParser.runnedAsAdmin()) {
    async.auto({
      checkChampionFolder: function(next) {
        if (!fs.existsSync(window.item_set_path)) {
          mkdirp(window.item_set_path, function(err) {
            next(err);
          });
        } else {
          next();
        }
      },
      createFolder: [
        'checkChampionFolder', function(next) {
          return mkdirp(path.join(window.item_set_path, 'testme'), function(err) {
            return next(err);
          });
        }
      ],
      createFile: [
        'createFolder', function(next) {
          return mkdirp(path.join(window.item_set_path, 'testme/test.txt'), function(err) {
            return next(err);
          });
        }
      ],
      deleteExistingFile: [
        'checkChampionFolder', function(next) {
          const champ_files = glob.sync(path.join(window.item_set_path, '**/*.json'));
          if (champ_files && champ_files[0]) {
            fs.remove(champ_files[0], function(err) {
              next(err);
            });
          } else {
            next();
          }
        }
      ],
      writeExisting: [
        'checkChampionFolder', function(next) {
          const champ_files = glob.sync(path.join(window.item_set_path, '**/*.json'));
          if (champ_files && champ_files[0]) {
            const data = fs.readFileSync(champ_files[0], 'utf8');
            fs.writeFile(champ_files[0], data, {
              encoding: 'utf8'
            }, function(err) {
              next(err);
            });
          } else {
            return next();
          }
        }
      ],
      cleanup: [
        'createFile', function(next) {
          return fs.remove(path.join(window.item_set_path, 'testme'), function(err) {
            return next(err);
          });
        }
      ]
    }, function(err) {
      if (err) {
        return step(new cErrors.FileWriteError('Permissions test failed').causedBy(err));
      }
      step(null);
    });
  } else {
    step(null);
  }
}


/**
 * Function
 * @param {String} Root path
 * @param {Array} Files
 * @callback {Function} Callback
 */

function setWindowsPermissions(files, next) {
  var cmds, permissions_file;
  cmds = _.map(files, function(f) {
    return 'ICACLS "' + f + '" /grant Users:F';
  });
  cmds.push('exit');
  permissions_file = path.join(preferences.directory(), 'set_permission.bat');
  return fs.writeFile(permissions_file, cmds.join('\n'), {
    encoding: 'utf8'
  }, function(err) {
    if (err) {
      return next(new cErrors.FileWriteError('Can\'t write set_permission.bat').causedBy(err));
    }
    return exec('START "" "' + permissions_file + '"', function(err, stdout, stderr) {
      return next(err);
    });
  });
}

module.exports = {
  championTest: championTest,
  setWindowsPermissions: setWindowsPermissions
};
