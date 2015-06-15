gulp = require 'gulp'
exec = require('child_process').exec
coffee = require 'gulp-coffee'
gulpif = require 'gulp-if'
uglify = require 'gulp-uglify'
fs = require 'fs-extra'
gutil = require 'gulp-util'

pkg = require '../package.json'


# Electron Settings
gulp.task 'electron:deps', (cb) ->
  installItems = []
  pkg['electron-deps'].forEach (item) ->
    installItems.push(item+'@'+pkg.dependencies[item])

  cmd = 'npm install ' + installItems.join(' ')
  cmd = cmd + ' --prefix ' + process.cwd() + '/dev'

  exec cmd, {cwd: '../'}, (err, std, ste) ->
    console.log(err) if err
    console.log(std)
    console.log(ste) if ste

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
