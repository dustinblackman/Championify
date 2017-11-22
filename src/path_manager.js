import fs from 'fs';
import glob from 'glob';
import path from 'path';
import R from 'ramda';
import $ from './helpers/jquery';

import store from './store';
import T from './translate';


/**
 * Finds league installation on OSX and Windows.
 */

function findInstallPath() {
  const user_home = process.env.HOME || process.env.USERPROFILE;
  if (process.platform === 'darwin') {
    if (fs.existsSync('/Applications/League of Legends.app')) {
      return this.setInstallPath(null, '/Applications/League of Legends.app/', 'Contents/LoL/Config/Champions/');
    } else if (fs.existsSync(`${user_home}/Applications/League of Legends.app`)) {
      return this.setInstallPath(null, `${user_home}/Applications/League of Legends.app/`, 'Contents/LoL/Config/Champions/');
    }
  } else if (fs.existsSync('C:/Riot Games/League Of Legends/LeagueClient.exe')) {
    return this.setInstallPath(null, 'C:/Riot Games/League Of Legends/', 'Config/Champions/', 'LeagueClient.exe');
  } else if (fs.existsSync('C:/Riot Games/League Of Legends/lol.launcher.exe')) {
    return this.setInstallPath(null, 'C:/Riot Games/League Of Legends/', 'Config/Champions/', 'lol.launcher.exe');
  }
}


/**
 * Function Verifies the users selected install paths. Warns if no League related files/diretories are found.
 * @param {String} User selected path
 */

// TODO: This could use a rewrite.
function checkInstallPath(selected_path, done) {
  if (selected_path && !R.is(String, selected_path)) selected_path = selected_path[0];
  try {
    fs.lstatSync(selected_path);
  } catch (_error) {
    $('#input_msg').addClass('red');
    $('#input_msg').text(T.t('invalid_path'));
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
    const default_path = path.join(selected_path, 'lol.launcher.exe');
    const new_launcher_path = path.join(selected_path, 'LeagueClient.exe');
    const garena_check_one = path.join(selected_path, 'lolex.exe');
    const garena_check_two = glob.sync(path.join(selected_path, 'LoL*Launcher.exe'))[0];

    if (fs.existsSync(new_launcher_path)) {
      done(null, selected_path, 'Config/Champions/', path.basename(new_launcher_path));
    } else if (fs.existsSync(default_path)) {
      done(null, selected_path, 'Config/Champions/', path.basename(default_path));
    } else if (fs.existsSync(garena_check_one)) {
      done(null, selected_path, 'Game/Config/Champions/', path.basename(garena_check_one));
    } else if (garena_check_two) {
      let garena_version = path.basename(glob.sync(path.join(selected_path, 'GameData/Apps/*'))[0]);
      done(null, selected_path, `GameData/Apps/${garena_version}/Game/Config/Champions/`, path.basename(garena_check_two));
    } else {
      done(new Error('Path not found'), selected_path);
    }
  }
}


/**
 * Sets the path string for the user to see on the interface.
 * @param {String} Path error. If false explains path error
 * @param {String} Installation path
 * @param {String} Champion folder path relative to Install Path
 * @param {String} Path to league executable
 */

function setInstallPath(path_err, install_path, champ_path, executable) {
  function enableBtns() {
    $('#import_btn').removeClass('disabled');
    return $('#delete_btn').removeClass('disabled');
  }
  function pathErr() {
    $('#input_msg').addClass('yellow');
    $('#input_msg').text(T.t('sure_thats_league'));
    return enableBtns();
  }
  function foundLeague() {
    $('#input_msg').addClass('green');
    $('#input_msg').text(`${T.t('found')} League of Legends!`);
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

  store.set('lol_install_path', install_path);
  store.set('lol_champ_path', champ_path);
  store.set('lol_executable', executable);
  store.set('itemset_path', path.join(install_path, champ_path));
  $('#install_path').val(install_path);

  if (path_err) return pathErr();
  return foundLeague();
}

export default {
  findInstallPath,
  checkInstallPath,
  setInstallPath
};
