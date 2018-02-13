import Promise from 'bluebird';
import babel from 'gulp-babel';
import { exec } from 'child_process';
import gulp from 'gulp';
import path from 'path';
import R from 'ramda';
import request from 'request';
import runSequence from 'run-sequence';
import { spawnAsync } from './helpers';

const fs = Promise.promisifyAll(require('fs-extra'));
const yauzl = Promise.promisifyAll(require('yauzl'));

const pkg = require('../package.json');


function _modeFromEntry(entry) {
  let attr = entry.externalFileAttributes >> 16 || 33188;
  return [448, 56, 7].map(function(mask) {
    return attr & mask;
  }).reduce(function(a, b) {
    return a + b;
  }, attr & 61440);
}

function _mtimeFromEntry(entry) {
  return yauzl.dosDateTimeToDate(entry.lastModFileDate, entry.lastModFileTime);
}

function _processZipEntry(zip, dest, entry) {
  const stat = new fs.Stats();
  stat.mode = _modeFromEntry(entry);
  stat.mtime = _mtimeFromEntry(entry);

  if (stat.isDirectory()) {
    return fs.mkdirsAsync(path.join(dest, entry.fileName));
  } else if (stat.isFile()) {
    return new Promise((resolve, reject) => {
      zip.openReadStream(entry, function(err, readStream) {
        if (err) return reject(err);

        const file_dest = path.join(dest, entry.fileName);
        const dest_dir = path.parse(file_dest).dir;
        if (!fs.existsSync(dest_dir)) fs.mkdirsSync(dest_dir);

        const write_stream = fs.createWriteStream(file_dest);
        readStream.pipe(write_stream);
        write_stream.on('finish', function() {
          if (stat.mode === 33261) exec(`chmod +x "${file_dest}"`);
          return resolve();
        });
      });
    });
  } else if (stat.isSymbolicLink()) {
    return new Promise((resolve, reject) => {
      zip.openReadStream(entry, function(err, readStream) {
        if (err) return reject(err);

        let symlink_path = '';
        readStream.on('data', function(c) {
          symlink_path += c;
        });
        readStream.on('end', function() {
          fs.symlinkSync(symlink_path, path.join(dest, entry.fileName));
          return resolve();
        });
        readStream.on('error', function(err) {
          if (err) return reject(err);
        });
      });
    });
  }
}

function _zipExtract(zipfile, dest = './') {
  fs.mkdirsSync(dest);
  const zip_entries = [];

  return yauzl.openAsync(zipfile, {autoClose: false})
    .then(zip => {
      return new Promise((resolve, reject) => {
        zip.on('entry', entry => zip_entries.push(entry));
        zip.on('end', () => resolve());
      })
      .then(() => zip_entries)
      .map(entry => _processZipEntry(zip, dest, entry))
      .then(() => zip.close());
    });
}

function download(url, download_path, overwrite = false) {
  if (overwrite) fs.removeSync(download_path);
  if (fs.existsSync(download_path)) return Promise.resolve();

  console.log(`Downloading: ${path.basename(url)}`);
  let file;
  try {
    file = fs.createWriteStream(download_path);
  } catch (err) {
    throw err;
  }

  const headers = {
    referer: `https://github.com/electron/electron/releases/tag/v${pkg.devDependencies['electron']}`,
    'user-agent': 'Championify Releases'
  };

  return new Promise((resolve, reject) => {
    return request({url, headers})
      .pipe(file)
      .on('error', reject)
      .on('close', function() {
        file.close();
        return resolve();
      });
  });
}

function extract(download_path, os) {
  const folder_name = os + pkg.devDependencies['electron'].replace(/\./g, '-');
  const cache_path = path.join('./cache', folder_name);
  if (fs.existsSync(cache_path)) return;

  console.log(`Extracting: ${download_path}`);
  fs.mkdirsSync(cache_path);
  return _zipExtract(download_path, cache_path)
    .then(() => {
      const license_file = path.join('./cache', folder_name, 'LICENSE');
      if (fs.existsSync(license_file)) fs.removeSync(license_file);
    });
}

function cache(os, arch) {
  fs.mkdirsSync('./cache');
  const version = pkg.devDependencies['electron'];
  const download_link = `https://github.com/electron/electron/releases/download/v${version}/electron-v${version}-${os}-${arch}.zip`;

  const zip_name = path.basename(download_link);
  const download_path = path.join('./cache', zip_name);

  return download(download_link, download_path)
    .then(() => extract(download_path, os));
}

gulp.task('electron:deps', function(cb) {
  const install_items = R.map(dep => {
    if (pkg.dependencies[dep].indexOf('git://') > -1) return pkg.dependencies[dep];
    return `${dep}@${pkg.dependencies[dep]}`;
  }, R.keys(pkg.dependencies));

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const download_url = `https://raw.githubusercontent.com/dustinblackman/electron-runas-builds/master/compiled/${pkg.devDependencies.electron}/win32/ia32/runas.node`;
  spawnAsync(npm, ['i', '--production', '--prefix', './dev'].concat(install_items))
    .then(() => download(download_url, path.join(__dirname, '../dev/node_modules/runas/build/Release/runas.node'), true))
    .then(() => {
      console.log('Adding main fix to ipaddr.js');
      const pkg_path = path.join(__dirname, '../dev/node_modules/ipaddr.js/package.json');
      const ipaddr_pkg = require(pkg_path);
      ipaddr_pkg.main = './lib/ipaddr.js';
      fs.writeFileSync(pkg_path, JSON.stringify(ipaddr_pkg), null, 2);
    })
    .asCallback(cb);
});

gulp.task('electron:settings', function() {
  return gulp.src(['./electron.js'], {base: './'})
    .pipe(babel(pkg.babel))
    .pipe(gulp.dest('./dev'));
});

gulp.task('electron:packagejson', function() {
  const package_json = {
    name: pkg.name,
    version: pkg.version,
    main: 'electron.js',
    author: pkg.author,
    description: pkg.description,
    electron_version: pkg.dependencies['electron']
  };
  fs.mkdirsSync(path.join(__dirname, '../dev/'));
  return fs.writeFileAsync(path.join(__dirname, '../dev/package.json'), JSON.stringify(package_json, null, 2), 'utf8');
});

gulp.task('electron:download:mac', function(cb) {
  return cache('darwin', 'x64', cb);
});

gulp.task('electron:download:win', function(cb) {
  return cache('win32', 'ia32', cb);
});

gulp.task('electron:download', function(cb) {
  if (process.platform === 'darwin') return runSequence('electron:download:mac', cb);
  return runSequence('electron:download:win', cb);
});
