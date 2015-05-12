gulp        = require 'gulp'
bower       = require 'gulp-bower'
preen       = require 'preen'
flatten     = require 'gulp-flatten'

# BOWER
gulp.task 'bower', ->
  return bower()

gulp.task 'preen', (cb) ->
  preen.preen {}, cb

gulp.task 'bower_copy', ->
  gulp.src('./bower_components/**/*.js')
    .pipe(flatten())
    .pipe gulp.dest('./dev/vendor/js/')

  gulp.src('./bower_components/**/*.map')
    .pipe(flatten())
    .pipe gulp.dest('./dev/vendor/js/')

  gulp.src('./bower_components/**/*.css')
    .pipe(flatten())
    .pipe gulp.dest('./dev/vendor/css/')

  gulp.src('./bower_components/font-awesome/fonts/**')
    .pipe(flatten())
    .pipe gulp.dest('./dev/vendor/fonts/')