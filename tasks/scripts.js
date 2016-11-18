import gulp from 'gulp';
import babel from 'gulp-babel';
import changed from 'gulp-changed';
import glob from 'glob';
import { load as markoLoad } from 'marko';
import stylus from 'gulp-stylus';
import nib from 'nib';
import path from 'path';
import R from 'ramda';

const pkg = require('../package.json');

gulp.task('babel', function() {
  return gulp.src('./src/**/*.js', {base: './src'})
    .pipe(changed('./src/**/*.js'))
    .pipe(babel(pkg.babel))
    .pipe(gulp.dest('./dev/js/'));
});

gulp.task('stylus', function() {
  const stylus_settings = {use: nib()};
  if (GLOBAL.if_release) stylus_settings.compress = true;
  return gulp.src('./stylesheets/index.styl')
    .pipe(stylus(stylus_settings))
    .pipe(gulp.dest('./dev/css'));
});

gulp.task('marko', function(cb) {
  R.forEach(file_path => {
    markoLoad(file_path);
  }, glob.sync(path.join(__dirname, '../dev/views/*.marko')));
  cb();
});
