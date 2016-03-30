import Promise from 'bluebird';
import gulp from 'gulp';
import path from 'path';
import runSequence from 'run-sequence';
import tar from 'tar-fs';
import zlib from 'zlib';

const fs = Promise.promisifyAll(require('fs-extra'));
const pkg = require('../package.json');

function renameAsar(asar, pkg_name, resource_path) {
  const root = path.join('./tmp', pkg_name, resource_path);
  const src = path.join(root, asar);
  const dest = path.join(root, asar.replace(/\./g, '-'));
  return fs.moveAsync(src, dest);
}

function tarball(os, done) {
  let pkg_name, resources_folder;
  if (os === 'osx') {
    pkg_name = pkg.name + '.app';
    resources_folder = 'Contents/Resources';
  } else {
    pkg_name = pkg.name;
    resources_folder = 'resources';
  }

  const os_tmp_path = path.join('./tmp', os);
  return Promise.all([
    renameAsar('app.asar', pkg_name, resources_folder),
    renameAsar('atom.asar', pkg_name, resources_folder)
  ])
    .then(() => fs.moveAsync(path.join('./tmp', pkg_name), path.join(os_tmp_path, pkg_name)))
    .then(() => {
      return new Promise(resolve => {
        const stream = fs.createWriteStream(`./releases/u_${os}.tar.gz`);
        stream.on('close', () => resolve());
        return tar.pack(os_tmp_path)
          .pipe(zlib.Gzip())
          .pipe(stream);
      });
    });
}

gulp.task('tarball:osx', function(cb) {
  return tarball('osx', cb);
});

gulp.task('tarball:win', function(cb) {
  return tarball('win', cb);
});

gulp.task('tarball:all', function(cb) {
  return runSequence(['tarball:osx', 'tarball:win'], cb);
});
