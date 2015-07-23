gulp = require 'gulp'
requireDir = require 'require-dir'
runSequence = require 'run-sequence'
_ = require 'lodash'

requireDir('./tasks')
pkg = require './package.json'

# Setup some globals
fileVersion = pkg.version.replace(/\./g, '-')

GLOBAL.releaseFile = _.template('./releases/Championify.<%- platform %>.'+fileVersion+'.zip')
GLOBAL.ifBuild = (process.argv.indexOf('build') > -1)


# Main Tasks
gulp.task 'main', (cb) ->
  runSequence(
    'delete-dev',
    'mkdir',

    ['electron:packagejson'
    'electron:settings',
    'bower_copy',
    'coffee',
    'stylus'],
    cb
  )

# TODO Symlink doesn't work for Windows.
gulp.task 'dev', ->
  runSequence(
    'main'
    'symlink',
    # 'copy'
    'run-watch')

gulp.task 'setup', ->
  runSequence('bower', 'preen')

gulp.task 'package-asar', (cb) ->
  runSequence(
    'main'
    'electron:deps',
    'copy',
    'removelivereload'
    'asar',
    cb
  )

gulp.task 'build', ->
  runSequence(
    'package-asar'
    'compile'
  )

gulp.task 'build:win', ->
  runSequence(
    'package-asar'
    'compile:win'
  )

gulp.task 'prerelease', (cb) ->
  runSequence(
    'delete-releases',
    'main',
    'electron:deps',
    'copy',
    'removelivereload',
    'asar',
    cb
  )

gulp.task 'release', ->
  runSequence(
    'prerelease',
    'compile:all',
    'move-asar',
    'virustotal',
    'github-release'
  )
