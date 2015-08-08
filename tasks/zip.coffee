gulp = require 'gulp'
path = require 'path'
runSequence = require 'run-sequence'
spawn = require('child_process').spawn

pkg = require '../package.json'

zip = (src, dest, done) ->
  current_process = spawn('7z', ['a', '-tzip', dest, src], {cwd: './tmp'})
  wasError = false

  current_process.stdout.on 'data', (msg) ->
    console.log(msg.toString())

  current_process.stderr.on 'data', (msg) ->
    console.error(msg.toString())
    wasError = true

  current_process.on 'close', (code) ->
    return done(true) if wasError
    done()


gulp.task 'zip:osx', (cb) ->
  src = pkg.name + '.app'
  dest = path.join('../', GLOBAL.releaseFile({platform: 'OSX', version: pkg.version}))
  zip(src, dest, cb)


gulp.task 'zip:win', (cb) ->
  src = pkg.name
  dest = path.join('../', GLOBAL.releaseFile({platform: 'WIN', version: pkg.version}))
  zip(src, dest, cb)


gulp.task 'zip:all', (cb) ->
  runSequence('zip:osx', 'zip:win', cb)
