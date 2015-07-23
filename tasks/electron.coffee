gulp = require 'gulp'
exec = require('child_process').exec
coffee = require 'gulp-coffee'
gulpif = require 'gulp-if'
uglify = require 'gulp-uglify'
fs = require 'fs-extra'
gutil = require 'gulp-util'
_ = require 'lodash'
npm = require 'npm'

pkg = require '../package.json'


# Electron Settings
gulp.task 'electron:deps', (cb) ->
  install_items = []
  _.each _.keys(pkg.dependencies), (item) ->
    if _.contains(pkg.dependencies[item], 'git://')
      install_items.push pkg.dependencies[item]
    else
      install_items.push item+'@'+pkg.dependencies[item]

  process.chdir './dev'
  npm.load ->
    npm.commands.install install_items, (err, data) ->
      return cb(err) if err
      process.chdir '..'
      cb()


gulp.task 'electron:settings', ->
  gulp.src(['./electron.coffee'], {base: './'})
    .pipe(coffee(bare: true).on('error', gutil.log))
    .pipe(gulpif(GLOBAL.ifBuild, uglify({mangle: false})))
    .pipe gulp.dest('./dev')


gulp.task 'electron:packagejson', (cb) ->
  packagejson = {
    name: pkg.name
    version: pkg.version
    main: 'electron.js'
  }
  json = JSON.stringify(packagejson, null, 2)
  fs.writeFile './dev/package.json', json, 'utf8', (err) ->
    console.log err if err
    cb()
