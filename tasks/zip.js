import gulp from 'gulp';
import path from 'path';
import runSequence from 'run-sequence';
import { spawn } from 'child_process';

const pkg = require('../package.json');

function zip(src, dest) {
  const current_process = spawn('7z', ['a', '-tzip', dest, src], {cwd: './tmp'});
  let is_error = false;

  return new Promise((resolve, reject) => {
    current_process.stdout.on('data', function(msg) {
      console.log(msg.toString());
    });

    current_process.stderr.on('data', function(msg) {
      console.error(msg.toString());
      is_error = true;
    });

    current_process.on('close', function(code) {
      if (is_error) return reject();
      return resolve();
    });
  });
}

function releaseFile(platform) {
  return `Championify.${platform}.${pkg.verson.replace(/\\./g, '-')}.zip`;
}

gulp.task('zip:osx', function(cb) {
  const src = `${pkg.name}.app`;
  const dest = path.join('../', releaseFile('OSX'));
  return zip(src, dest, cb);
});

gulp.task('zip:win', function(cb) {
  const src = pkg.name;
  const dest = path.join('../', releaseFile('WIN'));
  return zip(src, dest, cb);
});

gulp.task('zip:all', function(cb) {
  return runSequence(['zip:osx', 'zip:win'], cb);
});
