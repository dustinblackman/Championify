import gulp from 'gulp';
import babel from 'gulp-babel';
import changed from 'gulp-changed';
import stylus from 'gulp-stylus';
import nib from 'nib';

const pkg = require('../package.json');

gulp.task('babel', function() {
  return gulp.src('./src/**', {base: './src'})
    .pipe(changed('./src/**'))
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
