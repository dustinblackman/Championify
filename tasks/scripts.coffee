gulp = require 'gulp'
babel = require 'gulp-babel'
coffee = require 'gulp-coffee'
gutil = require 'gulp-util'
gulpif = require 'gulp-if'
flatten = require 'gulp-flatten'
stylus = require 'gulp-stylus'
nib = require 'nib'
uglify = require 'gulp-uglify'
changed = require 'gulp-changed'

pkg = require('../package.json')

gulp.task 'babel', ->
  gulp.src('./lib/**', {base: './lib'})
    .pipe(changed('./lib/**'))
    .pipe(babel(pkg.babel))
    .pipe gulp.dest('./dev/js/')

gulp.task 'stylus', ->
  stylus_settings = {use: nib()}
  if GLOBAL.ifRelease
    stylus_settings.compress = true

  gulp.src('./stylesheets/index.styl')
    .pipe(stylus(stylus_settings))
    .pipe gulp.dest('./dev/css')
