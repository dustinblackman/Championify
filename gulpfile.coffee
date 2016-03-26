gulp = require 'gulp'
requireDir = require 'require-dir'
runSequence = require 'run-sequence'
_ = require 'lodash'

requireDir('./tasks')
pkg = require './package.json'

# Setup some globals
GLOBAL.releaseFile = _.template('./releases/' + pkg.release_file_template)
GLOBAL.ifRelease = (process.argv.indexOf('release') > -1)


gulp.task 'setup', ->
  runSequence('bower', 'preen')

# Main Tasks
gulp.task 'main', (cb) ->
  runSequence(
    'delete-dev'
    'mkdir:app'
    ['electron:packagejson'
    'electron:settings'
    'bower_copy'
    'babel'
    'stylus']
    cb
  )

gulp.task 'dev', ->
  runSequence(
    'main'
    'copy:data'
    'dev_folder'
    'run-watch')

gulp.task 'package-asar', (cb) ->
  runSequence(
    'main'
    'electron:deps'
    ['copy:app'
    'copy:data'
    'copy:views'
    'copy:translations']
    'removelivereload'
    'asar'
    cb
  )

# Build is meant for building on Mac.
gulp.task 'build', (cb) ->
  if process.platform == 'win32'
    return runSequence('build:win', cb)
  else
    return runSequence('build:osx', cb)

gulp.task 'build:osx', (cb) ->
  runSequence(
    'package-asar'
    'compile:osx'
    'move:compiled-mac:folder'
    cb
  )

gulp.task 'build:win', (cb) ->
  runSequence(
    'package-asar'
    'compile:win'
    'move:compiled-win:folder'
    cb
  )

gulp.task 'release', ->
  runSequence(
    'test'
    'delete-releases'
    'create-releases-folder'
    'package-asar'
    'compile:all'
    'zip:all'
    'tarball:all'
    'move:asar:update'
    'virustotal'
    'github-release'
  )
