import { execSync } from 'child_process';
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

gulp.task('debug', function() {
  return runSequence('main', 'copy:data', 'dev-folder', 'run-debug');
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

gulp.task('build:win-sign', function(cb) {
  return runSequence('package-asar', 'compile:win', 'sign:win', 'move:compiled-win:folder', cb);
});

gulp.task('pre-dist', function(cb) {
  return runSequence('test', 'delete-releases', 'create-releases-folder', cb);
});

gulp.task('dist', function(cb) {
  return runSequence('test', 'delete-releases', 'create-releases-folder', 'package-asar', 'compile:all', 'sign:win', 'zip:all', cb);
});

gulp.task('dist:win', function(cb) {
  return runSequence('package-asar', 'compile:win', 'compile:win-installer', 'sign:win', 'zip:win', cb);
});

gulp.task('dist:osx', function(cb) {
  return runSequence('package-asar', 'compile:osx', 'compile:dmg', 'zip:osx', cb);
});

gulp.task('release', function(cb) {
  return runSequence('dist', 'virustotal', 'github-release', cb);
});

gulp.task('upload', function(cb) {
  return runSequence('virustotal', 'github-release', cb);
});

gulp.task('postinstall', function() {
  if (process.platform === 'darwin') {
    console.log('Replacing signtool.exe');
    execSync('curl -Ls "https://github.com/dustinblackman/mono-signtool/releases/download/0.0.2/mono-signtool.tar.gz" | tar xz -C ./node_modules/electron-winstaller/vendor/');
  }

  if (process.platform === 'win32') {
    execSync('.\\node_modules\\.bin\\electron-rebuild.cmd -f -a ia32 -w runas');
  }
});
