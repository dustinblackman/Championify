gulp = require 'gulp'
coffee = require 'gulp-coffee'
gutil = require 'gulp-util'
gulpif = require 'gulp-if'
flatten = require 'gulp-flatten'
stylus = require 'gulp-stylus'
nib = require 'nib'
coffeeify = require 'coffeeify'
uglify = require 'gulp-uglify'
changed = require 'gulp-changed'

# Coffee, Stylus
gulp.task 'coffee', ->
  gulp.src('./lib/**', {base: './lib'})
    .pipe(changed('./lib/**'))
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulpif(GLOBAL.ifRelease, uglify({mangle: false})))
    # .pipe(flatten())
    .pipe gulp.dest('./dev/js/')


gulp.task 'stylus', ->
  stylus_settings = {use: nib()}
  if GLOBAL.ifRelease
    stylus_settings.compress = true

  gulp.src('./stylesheets/index.styl')
    .pipe(stylus(stylus_settings))
    .pipe gulp.dest('./dev/css')
