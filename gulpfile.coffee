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
    'delete-dev',
    'mkdir:app',
    ['electron:packagejson'
    'electron:settings'
    'bower_copy'
    'coffee'
    'stylus']
    cb
  )

# TODO Symlink doesn't work for Windows.
gulp.task 'dev', ->
  runSequence(
    'main'
    'symlink:app'
    # 'copy'
    'run-watch')

gulp.task 'package-asar', (cb) ->
  runSequence(
    'main'
    'electron:deps'
    'copy:app'
    'removelivereload'
    'asar'
    cb
  )

# Build is meant for building on Mac.
gulp.task 'build', ->
  runSequence(
    'package-asar'
    'compile:mac'
    'move:compiled-mac:folder'
  )

gulp.task 'build:mac', ->
  runSequence('build')

gulp.task 'build:win', ->
  runSequence(
    'package-asar'
    'compile:win'
    'move:compiled-win:folder'
  )

gulp.task 'release', ->
  runSequence(
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
