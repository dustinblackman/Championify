import Promise from 'bluebird';
import clean from 'gulp-clean';
import glob from 'glob';
import gulp from 'gulp';
import path from 'path';
import runSequence from 'run-sequence';

const fs = Promise.promisify(require('fs-extra'));
const pkg = require('../package.json');


gulp.task('mkdir:app', function() {
  return Promise.resolve(glob.sync('./app/**/'))
    .each(fs.mkdirsAsync);
});

gulp.task('copy:app', function() {
  return Promise.resolve(glob.sync('./app/**', {nodir: true}))
    .each(file => {
      const newfile = file.replace('./app', './dev');
      return fs.copyAsync(file, newfile);
    });
});

gulp.task('copy:data', function() {
  return fs.copyAsync('./data/', './dev/data');
});

gulp.task('symlink:app', function() {
  return Promise.resolve(glob('./app/**', {nodir: true}))
    .each(old_path => {
      const new_path = old_path.replace('./app', './dev');
      old_path = old_path.replace('./app/', `${process.cwd()}/app/`);
      return fs.symlinkAsync(old_path, new_path);
    });
});

gulp.task('copy:views', function() {
  fs.mkdirsSync('./dev/views');
  return fs.copyAsync('./views/', './dev/views');
});

gulp.task('symlink:views', function() {
  fs.mkdirsSync('./dev/views');
  Promise.resolve(glob('./views/**', {nodir: true}))
    .each(old_path => {
      const new_path = old_path.replace('./views', './dev/views');
      old_path = old_path.replace('./views/', `${process.cwd()}/views/`);
      return fs.symlinkAsync(old_path, new_path);
    });
});

gulp.task('copy:translations', function(cb) {
  fs.mkdirsSync('./dev/i18n');
  return fs.copyAsync('./i18n/', './dev/i18n')
    .then(() => fs.removeAsync('./dev/i18n/_source.json'));
});

gulp.task('symlink:translations', function(cb) {
  fs.mkdirsSync('./dev/i18n');
  return Promise.resolve(glob('./i18n/*.json', {nodir: true}))
    .then(old_path => {
      if (old_path.indexOf('_source.json') > 1) return;
      const new_path = old_path.replace('./i18n', './dev/i18n');
      old_path = old_path.replace('./i18n/', `${process.cwd()}/i18n/`);
      return fs.symlinkAsync(old_path, new_path);
    });
});

gulp.task('dev_folder', function(cb) {
  if (process.platform === 'win32') return runSequence(['copy:app', 'copy:views', 'copy:translations'], cb);
  return runSequence(['symlink:app', 'symlink:views', 'symlink:translations'], cb);
});

gulp.task('delete-dev', function() {
  return gulp.src(['./dev', './tmp'])
    .pipe(clean({force: true}));
});

gulp.task('delete-releases', function() {
  return gulp.src(['./releases'])
    .pipe(clean({force: true}));
});

gulp.task('create-releases-folder', function() {
  return fs.mkdirsAsync('./releases');
});

gulp.task('move:asar:update', function() {
  return fs.copyAsync('./tmp/app.asar', './releases/update.asar');
});

gulp.task('move:compiled-win:folder', function(cb) {
  return fs.moveAsync(path.join('./tmp', pkg.name), path.join('./releases', pkg.name), {clobber: true});
});

gulp.task('move:compiled-mac:folder', function(cb) {
  return fs.moveAsync(path.join('./tmp', pkg.name + '.app'), path.join('./releases', pkg.name + '.app'), {clobber: true});
});
