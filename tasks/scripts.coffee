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
  gulp.src(['./functions/browser.coffee', './functions/deps.coffee'], {base: './'})
    .pipe(coffee(bare: true).on('error', gutil.log))
    .pipe(gulpif(GLOBAL.ifBuild, uglify()))
    .pipe(flatten())
    .pipe gulp.dest('./dev/js/')


gulp.task 'stylus', ->
  gulp.src('./stylesheets/*.styl')
  .pipe(stylus({use: nib(), compress: true}))
  .pipe gulp.dest('./dev/css')


gulp.task 'browserify', (cb) ->
  browserify({
    transform: [coffeeify]
    entries: ['./functions/championify.coffee']
  })
  .bundle()
  .pipe(source('main.js'))
  .pipe(gulpif(GLOBAL.ifBuild, buffer()))
  .pipe(gulpif(GLOBAL.ifBuild, uglify()))
  .pipe(gulp.dest('./dev/js/'))
