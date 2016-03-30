import gulp from 'gulp';
import requireDir from 'require-dir';
import runSequence from 'run-sequence';
import _ from 'lodash';

requireDir('./tasks');

const pkg = require('./package.json');
GLOBAL.releaseFile = _.template('./releases/' + pkg.release_file_template);
GLOBAL.ifRelease = process.argv.indexOf('release') > -1;

gulp.task('main', function(cb) {
  return runSequence('delete-dev', 'mkdir:app', ['electron:packagejson', 'electron:settings', 'babel', 'stylus'], cb);
});

gulp.task('dev', function() {
  return runSequence('main', 'copy:data', 'dev_folder', 'run-watch');
});

gulp.task('package-asar', function(cb) {
  return runSequence('main', 'electron:deps', ['copy:app', 'copy:data', 'copy:views', 'copy:translations'], 'removelivereload', 'asar', cb);
});

gulp.task('build', function(cb) {
  if (process.platform === 'win32') return runSequence('build:win', cb);
  return runSequence('build:osx', cb);
});

gulp.task('build:osx', function(cb) {
  return runSequence('package-asar', 'compile:osx', 'move:compiled-mac:folder', cb);
});

gulp.task('build:win', function(cb) {
  return runSequence('package-asar', 'compile:win', 'move:compiled-win:folder', cb);
});

gulp.task('release', function() {
  return runSequence('test', 'delete-releases', 'create-releases-folder', 'package-asar', 'compile:all', 'zip:all', 'tarball:all', 'move:asar:update', 'virustotal', 'github-release');
});
