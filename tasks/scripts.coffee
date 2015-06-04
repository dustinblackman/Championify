gulp        = require 'gulp'
coffee      = require 'gulp-coffee'
gutil       = require 'gulp-util'
gulpif      = require 'gulp-if'
flatten     = require 'gulp-flatten'
stylus      = require 'gulp-stylus'
nib         = require 'nib'
browserify  = require 'browserify'
coffeeify   = require 'coffeeify'
buffer      = require 'vinyl-buffer'
uglify      = require 'gulp-uglify'
source      = require 'vinyl-source-stream'

# Coffee, Stylus, Browserify
gulp.task 'coffee', ->
  gulp.src(['./lib/main.coffee', './lib/deps.coffee'], {base: './'})
    .pipe(coffee(bare: true).on('error', gutil.log))
    .pipe(gulpif(GLOBAL.ifBuild, uglify({mangle: false})))
    .pipe(flatten())
    .pipe gulp.dest('./dev/js/')


gulp.task 'stylus', ->
  stylus_settings = {use: nib()}
  if GLOBAL.ifBuild
    stylus_settings.compress = true

  gulp.src('./stylesheets/*.styl')
  .pipe(stylus(stylus_settings))
  .pipe gulp.dest('./dev/css')


gulp.task 'browserify', (cb) ->
  browserify({
    transform: [coffeeify]
    entries: ['./lib/championify.coffee']
  })
  .bundle()
  .pipe(source('championify.js'))
  .pipe(gulpif(GLOBAL.ifBuild, buffer()))
  .pipe(gulpif(GLOBAL.ifBuild, uglify({mangle: false})))
  .pipe(gulp.dest('./dev/js/'))
