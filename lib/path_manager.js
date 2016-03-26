import fs from 'fs';
import glob from 'glob';
import path from 'path';
import _ from 'lodash';

import T from './translate';


/**
 * Function Auto discovery of League installation.
 */

function findInstallPath() {
  const userHome = process.env.HOME || process.env.USERPROFILE;
  if (process.platform === 'darwin') {
    if (fs.existsSync('/Applications/League of Legends.app')) {
      return this.setInstallPath(null, '/Applications/League of Legends.app/', 'Contents/LoL/Config/Champions/');
    } else if (fs.existsSync(userHome + '/Applications/League of Legends.app')) {
      return this.setInstallPath(null, userHome + '/Applications/League of Legends.app/', 'Contents/LoL/Config/Champions/');
    }
  } else if (fs.existsSync('C:/Riot Games/League Of Legends/lol.launcher.exe')) {
    return this.setInstallPath(null, 'C:/Riot Games/League Of Legends/', 'Config/Champions/', 'lol.launcher.exe');
  }
}


/**
 * Function Verifies the users selected install paths. Warns if no League related files/diretories are found.
 * @param {String} User selected path
 */

function checkInstallPath(selected_path, done) {
  // var default_path, e, garena_check_one, garena_check_two, garena_version;
  if (selected_path && !_.isString(selected_path)) {
    selected_path = selected_path[0];
  }
  try {
    fs.lstatSync(selected_path);
  } catch (_error) {
    $('#input_msg').addClass('red');
    $('#input_msg').text("" + (T.t('invalid_path')));
    return;
  }

  if (process.platform === 'darwin') {
    if (fs.existsSync(path.join(selected_path, 'Contents/LoL/'))) {
      done(null, selected_path, 'Contents/LoL/Config/Champions/');
    } else if (fs.existsSync(path.join(selected_path, 'League of Legends.app'))) {
      done(null, path.join(selected_path, 'League of Legends.app'), 'Contents/LoL/Config/Champions/');
    } else {
      done(new Error('Path not found'), selected_path);
    }
  } else {
    let default_path = path.join(selected_path, 'lol.launcher.exe');
    let garena_check_one = path.join(selected_path, 'lol.exe');
    let garena_check_two = glob.sync(path.join(selected_path, 'LoL*Launcher.exe'))[0];
    if (fs.existsSync(default_path)) {
      done(null, selected_path, 'Config/Champions/', path.basename(default_path));
    } else if (fs.existsSync(garena_check_one)) {
      done(null, selected_path, 'Game/Config/Champions/', path.basename(garena_check_one));
    } else if (garena_check_two) {
      let garena_version = path.basename(glob.sync(path.join(selected_path, 'GameData/Apps/*'))[0]);
      done(null, selected_path, 'GameData/Apps/' + garena_version + '/Game/Config/Champions/', path.basename(garena_check_two));
    } else {
      done(new Error('Path not found'), selected_path);
    }
  }
}


/**
 * Function Sets the path string for the user to see on the interface.
 * @param {String} If !=, explains path error
 * @param {String} Install path
 * @param {String} Champion folder path relative to Install Path
 */

function setInstallPath(path_err, install_path, champ_path, executable) {
  function enableBtns() {
    $('#import_btn').removeClass('disabled');
    return $('#delete_btn').removeClass('disabled');
  }
  function pathErr() {
    $('#input_msg').addClass('yellow');
    $('#input_msg').text("" + (T.t('sure_thats_league')));
    return enableBtns();
  }
  function foundLeague() {
    $('#input_msg').addClass('green');
    $('#input_msg').text((T.t('found')) + " League of Legends!");
    return enableBtns();
  }
  $('#input_msg').removeAttr('class');
  $('#input_msg').text('');

  if (!champ_path) {
    if (process.platform === 'darwin') {
      champ_path = 'Contents/LoL/Config/Champions/';
    } else {
      champ_path = 'Config/Champions/';
    }
  }
  window.lol_install_path = install_path;
  window.lol_champ_path = champ_path;
  window.lol_executable = executable;
  window.item_set_path = path.join(install_path, champ_path);
  $('#install_path').val(install_path);
  if (path_err) {
    return pathErr();
  }
  return foundLeague();
}

module.exports = {
  findInstallPath: findInstallPath,
  checkInstallPath: checkInstallPath,
  setInstallPath: setInstallPath
};
