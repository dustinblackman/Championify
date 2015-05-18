gulp        = require 'gulp'
asar        = require 'gulp-asar'
atomshell   = require 'gulp-atom-shell'
runSequence = require 'run-sequence'
path        = require 'path'

pkg         = require '../package.json'
version = pkg.devDependencies['electron-prebuilt'].replace(/\^/g, '')

# Build
gulp.task 'asar', ->
  gulp.src('./dev/**', {base: './dev/'})
    .pipe(asar('app.asar'))
    .pipe(gulp.dest('tmp'))


gulp.task 'compile:win', ->
  buildCfg = {
    version: version
    platform: 'win32'
    winIcon: path.normalize('./resources/win/Championify.ico')
    companyName: pkg.author
    copyright: [pkg.license, pkg.author, '2015'].join(' ')
    asar: true
  }

  gulp.src(['./dev/package.json', './tmp/app.asar'])
    .pipe atomshell(buildCfg)
    .pipe atomshell.zfsdest(GLOBAL.releaseFile({'platform': 'WIN'}))


gulp.task 'compile:mac', ->
  buildCfg = {
    version: version
    platform: 'darwin'
    darwinIcon: './resources/osx/Championify.icns'
    asar: true
  }

  gulp.src(['./dev/package.json', './tmp/app.asar'])
    .pipe atomshell(buildCfg)
    .pipe atomshell.zfsdest(GLOBAL.releaseFile({'platform': 'MAC'}))


gulp.task 'compile', (cb) ->
  if process.platform == 'darwin'
    runSequence('compile:mac', cb)
  else
    runSequence('compile:win', cb)


gulp.task 'compile:all', (cb) ->
  runSequence('compile:mac', 'compile:win', cb)
