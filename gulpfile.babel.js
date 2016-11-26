import gulp from 'gulp';
import requireDir from 'require-dir';
import runSequence from 'run-sequence';

requireDir('./tasks');

global.if_release = process.argv.indexOf('release') > -1;

gulp.task('main', function(cb) {
  return runSequence('delete-dev', 'mkdir:app', ['electron:packagejson', 'electron:settings', 'stylus'], cb);
});

gulp.task('dev', function() {
  return runSequence('main', 'copy:data', 'dev-folder', 'run-watch');
});

gulp.task('package-asar', function(cb) {
  return runSequence('main', ['babel', 'electron:deps'], ['copy:app', 'copy:data', 'copy:translations', 'copy:views', 'clean:node_modules'], 'marko', 'asar', cb);
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
