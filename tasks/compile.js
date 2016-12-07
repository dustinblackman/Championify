import Promise from 'bluebird';
import appdmg from 'appdmg';
import gulp from 'gulp';
import { signAsync as macSignAsync } from 'electron-osx-sign';
import moment from 'moment';
import path from 'path';
import plist from 'plist';
import R from 'ramda';
import runSequence from 'run-sequence';
import { spawnAsync } from './helpers';

const asar = Promise.promisifyAll(require('asar'));
const fs = Promise.promisifyAll(require('fs-extra'));
const rcedit = Promise.promisify(require('rcedit'));
const winstaller = require('electron-winstaller');
const pkg = require('../package.json');
const electron_version = pkg.devDependencies['electron'];


function copyright() {
  return `Copyright (C) ${moment().format('YYYY')} ${pkg.author}. All rights reserved`;
}

function pkgIdentifier() {
  const author = pkg.author.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const name = pkg.name.toLowerCase();
  return `com.${author}.${name}`;
}

function helperPList(tmp_path, name) {
  const split_name = name.split(' ');
  const app_path = path.join(tmp_path, 'Contents/Frameworks', `${name}.app`);
  const new_app_name = name.split(' ');
  new_app_name[0] = pkg.name;
  const new_app_path = path.join(tmp_path, 'Contents/Frameworks', `${new_app_name.join(' ')}.app`);
  const new_pkg_name = name.replace('Electron', pkg.name);

  const identifier = [pkgIdentifier(), 'helper'];
  if (split_name.length > 2) identifier.push(split_name[2].toLowerCase());

  const plist_file = path.join(app_path, 'Contents/Info.plist');
  const info_plist = plist.parse(fs.readFileSync(plist_file, 'utf8'));
  info_plist['CFBundleDisplayName'] = new_pkg_name;
  info_plist['CFBundleExecutable'] = new_pkg_name;
  info_plist['CFBundleName'] = new_pkg_name;
  info_plist['CFBundleIdentifier'] = identifier.join('.');

  return fs.writeFileAsync(plist_file, plist.build(info_plist), 'utf8')
    .then(() => fs.moveAsync(path.join(app_path, 'Contents/MacOS', name), path.join(app_path, 'Contents/MacOS', new_pkg_name)))
    .then(() => fs.moveAsync(app_path, new_app_path));
}

gulp.task('asar', function() {
  return asar.createPackageAsync('./dev', './tmp/app.asar');
});

gulp.task('_compileMac', function() {
  const src_folder = `darwin${electron_version.replace(/\./g, '-')}`;
  const tmp_path = path.join('./tmp', pkg.name + '.app');

  fs.copySync(path.join('./cache', src_folder, 'Electron.app'), tmp_path);
  const info_plist = plist.parse(fs.readFileSync(path.join(tmp_path, 'Contents/Info.plist'), 'utf8'));
  info_plist['CFBundleExecutable'] = pkg.name;
  info_plist['CFBundleName'] = pkg.name;
  info_plist['CFBundleDisplayName'] = pkg.name;
  info_plist['CFBundleIdentifier'] = pkgIdentifier();
  info_plist['CFBundleVersion'] = pkg.version;
  info_plist['CFBundleShortVersionString'] = pkg.version;
  info_plist['CFBundleIconFile'] = pkg.name + '.icns';
  info_plist['NSHumanReadableCopyright'] = copyright();

  return fs.removeAsync(path.join(tmp_path, 'Contents/Resources/atom.icns'))
    .then(() => Promise.all([
      fs.copyAsync('./resources/osx/icon.icns', path.join(tmp_path, `/Contents/Resources/${pkg.name}.icns`)),
      fs.copyAsync('./tmp/app.asar', path.join(tmp_path, 'Contents/Resources/app.asar')),
      fs.copyAsync('./LICENSE', path.join(tmp_path, 'Contents/Resources/LICENSE')),
      fs.moveAsync(path.join(tmp_path, 'Contents/MacOS/Electron'), path.join(tmp_path, 'Contents/MacOS/', pkg.name)),
      fs.writeFileAsync(path.join(tmp_path, 'Contents/Info.plist'), plist.build(info_plist), 'utf8'),
      helperPList(tmp_path, 'Electron Helper'),
      helperPList(tmp_path, 'Electron Helper EH'),
      helperPList(tmp_path, 'Electron Helper NP'),
      fs.removeAsync(path.join(tmp_path, 'Contents/Resources/default_app'))
    ]))
    .then(() => {
      if (!process.env.SIGN_OSX_IDENTITY) return console.log('WARNING: OSX app not signed');
      return macSignAsync({app: tmp_path})
        .catch(err => {
          if (!R.contains('release', process.argv)) return console.log('WARNING: OSX app not signed');
          throw err;
        });
    })
    .catch(err => {
      console.log(err.stack || err);
      throw err;
    });
});

gulp.task('compile:osx', function(cb) {
  return runSequence('electron:download:mac', '_compileMac', cb);
});

gulp.task('_createdmg', function(cb) {
  const target = `./releases/${pkg.name}.OSX.${pkg.version.replace(/\\./g, '-')}.dmg`;
  if (fs.existsSync(target)) fs.removeSync(target);
  const ee = appdmg({
    basepath: path.join(__dirname, '..'),
    target,
    specification: {
      title: `${pkg.name} ${pkg.version}`,
      icon: './resources/osx/icon.icns',
      format: 'UDBZ',
      contents: [
        {x: 448, y: 344, type: 'link', path: '/Applications'},
        {x: 192, y: 344, type: 'file', path: `./tmp/${pkg.name}.app`}
      ]
    }
  });

  ee.on('progress', data => {
    if (data.type !== 'step-end') console.log(JSON.stringify(data));
  });
  ee.on('error', err => cb(err));
  ee.on('finish', () => {
    if (R.contains('release', process.argv) && !process.env.SIGN_OSX_IDENTITY) cb(new Error('SIGN_OSX_IDENTITY env does not exist'));
    spawnAsync('codesign', ['-s', process.env.SIGN_OSX_IDENTITY, target]).asCallback(cb);
  });
});

gulp.task('compile:dmg', function() {
  if (!fs.existsSync(`./tmp/${pkg.name}.app`)) return runSequence('package-asar', 'compile:osx', '_createdmg');
  return runSequence('_createdmg');
});

gulp.task('_compileWin', function() {
  const src_folder = `win32${electron_version.replace(/\./g, '-')}`;
  const tmp_path = path.join('./tmp/', pkg.name);
  const exe_path = path.join(tmp_path, `${pkg.name.toLowerCase()}.exe`);

  const rc_patch = {
    icon: './resources/win/icon.ico',
    'version-string': {
      CompanyName: pkg.author,
      FileDescription: pkg.name,
      LegalCopyright: copyright(),
      ProductName: pkg.name,
      ProductVersion: pkg.version
    }
  };

  const elevate_path = path.join(tmp_path, 'resources/championify_elevate.exe');
  const elevate_rc = {icon: './resources/win/icon.ico'};

  return fs.copyAsync(path.join('./cache', src_folder), tmp_path)
    .then(() => Promise.all([
      fs.copyAsync('./tmp/app.asar', path.join(tmp_path, 'resources/app.asar')),
      fs.copyAsync('./LICENSE', path.join(tmp_path, 'LICENSE')),
      fs.copyAsync('./resources/win/elevate.exe', elevate_path).then(() => rcedit(elevate_path, elevate_rc)),
      fs.removeAsync(path.join(tmp_path, '/resources/default_app')),
      fs.moveAsync(path.join(tmp_path, 'electron.exe'), exe_path),
      rcedit(exe_path, rc_patch)
    ]));
});

gulp.task('compile:win', function(cb) {
  return runSequence('electron:download:win', '_compileWin', cb);
});

gulp.task('_wininstaller', function() {
  const filename = `Championify.Windows_Setup.${pkg.version.replace(/\\./g, '-')}.exe`;
  const rc = {icon: './resources/win/setup.ico'};

  return winstaller.createWindowsInstaller({
    appDirectory: './tmp/Championify',
    outputDirectory: './releases',
    exe: `${pkg.name.toLowerCase()}.exe`,
    iconUrl: 'https://raw.githubusercontent.com/dustinblackman/Championify/master/resources/win/icon.ico',
    setupExe: filename,
    noMsi: true
  })
  .then(() => rcedit(path.join('./releases', filename), rc));
});

gulp.task('compile:win-installer', function() {
  if (!fs.existsSync(`./tmp/${pkg.name}`)) return runSequence('package-asar', 'compile:win', '_wininstaller');
  return runSequence('_wininstaller');
});

gulp.task('compile', function(cb) {
  if (process.platform === 'darwin') return runSequence('compile:osx', cb);
  return runSequence('compile:win', cb);
});

gulp.task('compile:all', function(cb) {
  return runSequence(['compile:osx', 'compile:win'], ['compile:win-installer', 'compile:dmg'], cb);
});
