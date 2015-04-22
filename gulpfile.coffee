gulp = require 'gulp'
async = require 'async'
fs = require 'fs'
coffee = require 'gulp-coffee'
uglify = require 'gulp-uglify'
gutil = require 'gulp-util'
clean = require 'gulp-clean'
fs = require 'fs-extra'
mkdirp = require 'mkdirp'
runSequence = require 'run-sequence'
glob = require 'glob'
exec = require('child_process').exec
pkg = require './package.json'

GLOBAL.buildFileName = 'championify'


gulp.task 'mkdir', (cb) ->
  glob './app/**/' , (err, paths) ->
    async.each paths, (path, acb) ->
      path = path.replace('./app', './dev')
      mkdirp path, ->
        acb()
    , ->
      cb()

gulp.task 'symlink', (cb) ->
  glob './app/**', {nodir: true} , (err, paths) ->
    async.each paths, (oldPath, acb) ->
      newPath = oldPath.replace('./app', './dev')
      oldPath = oldPath.replace('./app/', process.cwd()+'/app/')
      fs.symlink oldPath, newPath, (err) ->
        acb null
    , () ->
      cb()

gulp.task 'coffee', ->
  gulp.src(['./atomshell.coffee'], {base: './'})
    .pipe(coffee(bare: true).on('error', gutil.log))
    # .pipe(uglify())
    .pipe gulp.dest('./dev')


# gulp.task 'clean', ->
#   gulp.src(['./app.js', './helpers.js'])
#     .pipe(clean(force: true))
#
# gulp.task 'clean-build', ->
#   gulp.src(['./build'])
#     .pipe(clean(force: true))
#
#
# gulp.task 'coffee', ->
#   gulp.src(['./app.coffee', './helpers.coffee'], {base: './'})
#     .pipe(coffee(bare: true).on('error', gutil.log))
#     .pipe(uglify())
#     .pipe gulp.dest('./')

# gulp.task 'build', () ->
#   runSequence('clean', 'clean-build', 'mkdir', 'coffee', 'compile', 'package', 'clean')

gulp.task 'dev', ->
  runSequence('mkdir', 'symlink', 'coffee')
