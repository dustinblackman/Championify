gulp        = require 'gulp'
requireDir  = require 'require-dir'
runSequence = require 'run-sequence'
_           = require 'lodash'

requireDir('./tasks')
pkg         = require './package.json'

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
    'stylus',
    'browserify'],
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

gulp.task 'build', ->
  runSequence(
    'main'
    'electron:deps',
    'copy',
    'removelivereload'
    'asar',
    'compile'
  )

gulp.task 'release', ->
  runSequence(
    'delete-releases',
    'main',
    'electron:deps',
    'copy',
    'removelivereload'
    'asar',
    'compile:all',
    'move-asar',
    'virustotal',
    'github-release'
  )
