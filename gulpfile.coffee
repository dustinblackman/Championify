gulp = require 'gulp'
coffee = require 'gulp-coffee'
uglify = require 'gulp-uglify'
gutil = require 'gulp-util'
clean = require 'gulp-clean'
fs = require 'fs-extra'
mkdirp = require 'mkdirp'
runSequence = require 'run-sequence'
enclose = require('enclose').exec
exec = require('child_process').exec
pkg = require './package.json'

GLOBAL.buildFileName = 'championify'

binCompile = (x64, cb) ->
  if process.platform != 'darwin'
    GLOBAL.buildFileName = GLOBAL.buildFileName+'.exe'

  flags = []

  if x64
    flags.push '--x64'

  flags.push '--loglevel', 'info'
  flags.push '-o', './build/'+process.platform+'/'+GLOBAL.buildFileName
  flags.push './app.js'
  ee = enclose(flags)
  ee.on "exit", () ->
    cb()


gulp.task 'mkdir', (cb) ->
  mkdirp './build/'+process.platform, ->
    cb()


gulp.task 'clean', ->
  gulp.src(['./app.js', './helpers.js'])
    .pipe(clean(force: true))

gulp.task 'clean-build', ->
  gulp.src(['./build'])
    .pipe(clean(force: true))


gulp.task 'coffee', ->
  gulp.src(['./app.coffee', './helpers.coffee'], {base: './'})
    .pipe(coffee(bare: true).on('error', gutil.log))
    .pipe(uglify())
    .pipe gulp.dest('./')


gulp.task 'compile', (cb) ->
  # if process.arch == 'x64'
  #   binCompile true, cb
  # else
  #   binCompile false, cb
  binCompile false, cb


gulp.task 'package', (cb) ->
  if process.platform == 'darwin'
    fs.copy './resources/osx/Championify.app/', './build/darwin/Championify.app', (err) ->
      fs.move './build/darwin/championify', './build/darwin/Championify.app/Contents/MacOS/championify', (err) ->
        cb()
  else
    ResHackerPath = 'buildtools/ResHacker.exe'
    filePath = 'build/'+process.platform+'/'+GLOBAL.buildFileName
    iconPath = 'resources/win/Championify.ico'
    cmd = 'start '+ResHackerPath+' -addoverwrite "'+filePath+'", "'+filePath+'", "'+iconPath+'", ICONGROUP, IDR_MAINFRAME, 1033'
    console.log cmd
    exec cmd, (err, std, ste) ->
      console.log err if err
      console.log std
      console.log ste

      cb()


gulp.task 'build', () ->
  runSequence('clean', 'clean-build', 'mkdir', 'coffee', 'compile', 'package', 'clean')
