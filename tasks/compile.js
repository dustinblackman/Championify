import Promise from 'bluebird';
import asar from 'asar';
import gulp from 'gulp';
import inno from 'gulp-inno';
import moment from 'moment';
import path from 'path';
import plist from 'plist';
import runSequence from 'run-sequence';
import _ from 'lodash';

const fs = Promise.promisify(require('fs-extra'));
const rcedit = Promise.promisify(require('rcedit'));
const pkg = require('../package.json');
const electron_version = pkg.devDependencies['electron-prebuilt'];


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
  const new_app_name = `${split_name}`;
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
  return gulp.src('./dev/**', {base: './dev/'})
    .pipe(asar('app.asar'))
    .pipe(gulp.dest('tmp'));
});

gulp.task('_compileMac', function() {
  const src_folder = `darwin${electron_version.replace(/\./g, '-')}`;
  const tmp_path = path.join('./tmp', pkg.name + '.app');

  const info_plist = plist.parse(fs.readFileSync(path.join(tmp_path, 'Contents/Info.plist'), 'utf8'));
  info_plist['CFBundleExecutable'] = pkg.name;
  info_plist['CFBundleName'] = pkg.name;
  info_plist['CFBundleDisplayName'] = pkg.name;
  info_plist['CFBundleIdentifier'] = pkgIdentifier();
  info_plist['CFBundleVersion'] = pkg.version;
  info_plist['CFBundleShortVersionString'] = pkg.version;
  info_plist['CFBundleIconFile'] = pkg.name + '.icns';
  info_plist['NSHumanReadableCopyright'] = copyright();

  return fs.copyAsync(path.join('./cache', src_folder, 'Electron.app'), tmp_path)
    .then(() => fs.removeAsync(path.join(tmp_path, 'Contents/Resources/atom.icns')))
    .then(() => Promise.all([
      fs.copyAsync('./tmp/app.asar', path.join(tmp_path, 'Contents/Resources/app.asar')),
      fs.moveAsync(path.join(tmp_path, 'Contents/MacOS/Electron'), path.join(tmp_path, 'Contents/MacOS/', pkg.name)),
      fs.writeFileAsync(path.join(tmp_path, 'Contents/Info.plist'), plist.build(info_plist), 'utf8'),
      helperPList(tmp_path, 'Electron Helper'),
      helperPList(tmp_path, 'Electron Helper EH'),
      helperPList(tmp_path, 'Electron Helper NP'),
      fs.removeAsync(path.join(tmp_path, 'Contents/Resources/default_app'))
    ]));
});

gulp.task('compile:osx', function(cb) {
  return runSequence('electron:download:mac', '_compileMac', cb);
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

  return fs.copyAsync(path.join('./cache', src_folder), tmp_path)
    .then(() => Promise.all([
      fs.copyAsync('./tmp/app.asar', path.join(tmp_path, 'resources/app.asar')),
      fs.removeAsync(path.join(tmp_path, '/resources/default_app')),
      fs.moveAsync(path.join(tmp_path, 'electron.exe'), exe_path),
      rcedit(exe_path, rc_patch)
    ]));
});

gulp.task('compile:win', function(cb) {
  return runSequence('electron:download:win', '_compileWin', cb);
});

gulp.task('_wininstaller', function() {
  const inno_script = _.template(fs.readFileSync('./resources/win/inno_script.iss'));
  let data_path = path.resolve('./tmp/' + pkg.name).replace(/\//g, '\\');
  let release_path = process.cwd().replace(/\//g, '\\') + '\\releases';

  if (process.platform !== 'win32') {
    release_path = `Z:${release_path}`;
    data_path = `Z:${data_path}`;
  }

  const inno_compiled = inno_script({
    version: pkg.version,
    description: pkg.description,
    url: pkg.repository.url,
    output_path: release_path,
    exe: pkg.name,
    data_path
  });

  fs.writeFileSync('./tmp/installerscript.iss', inno_compiled, 'utf8');
  return gulp.src('./tmp/installerscript.iss').pipe(inno());
});

gulp.task('compile:win-installer', function(cb) {
  if (fs.existsSync(`./tmp/${pkg.name}`)) return runSequence('_wininstaller', cb);
  return runSequence('package-asar', 'compile:win', '_wininstaller', cb);
});

gulp.task('compile', function(cb) {
  if (process.platform === 'darwin') return runSequence('compile:osx', cb);
  return runSequence('compile:win', cb);
});

gulp.task('compile:all', function(cb) {
  return runSequence(['compile:osx', 'compile:win'], 'compile:win-installer', cb);
});
