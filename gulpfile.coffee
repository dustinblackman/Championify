async       = require 'async'
atomshell   = require 'gulp-atom-shell'
bower       = require 'gulp-bower'
buffer      = require 'vinyl-buffer'
browserify  = require 'browserify'
clean       = require 'gulp-clean'
coffee      = require 'gulp-coffee'
coffeeify   = require 'coffeeify'
deleteLines = require 'gulp-delete-lines'
exec        = require('child_process').exec
flatten     = require 'gulp-flatten'
fs          = require 'fs-extra'
glob        = require 'glob'
gulp        = require 'gulp'
gulpAsar    = require 'gulp-asar'
gulpif      = require 'gulp-if'
gutil       = require 'gulp-util'
mkdirp      = require 'mkdirp'
nib         = require 'nib'
path        = require 'path'
preen       = require 'preen'
runSequence = require 'run-sequence'
source      = require 'vinyl-source-stream'
stylus      = require 'gulp-stylus'
uglify      = require 'gulp-uglify'

pkg         = require './package.json'

# Setup some globals
fileVersion = pkg.version.replace(/\./g, '-')
if process.platform == 'darwin'
  platform = 'MAC'
else
  platform = 'WIN'

GLOBAL.releaseFile = './releases/Championify.'+platform+'.'+fileVersion+'.zip'
GLOBAL.ifBuild = (process.argv.indexOf('build') > -1)

# BOWER
gulp.task 'bower', ->
  return bower()

gulp.task 'preen', (cb) ->
  preen.preen {}, cb

gulp.task 'bower_copy', ->
  gulp.src('./bower_components/**/*.js')
    .pipe(flatten())
    .pipe gulp.dest('./dev/vendor/js/')

  gulp.src('./bower_components/**/*.map')
    .pipe(flatten())
    .pipe gulp.dest('./dev/vendor/js/')

  gulp.src('./bower_components/**/*.css')
    .pipe(flatten())
    .pipe gulp.dest('./dev/vendor/css/')

  gulp.src('./bower_components/font-awesome/fonts/**')
    .pipe(flatten())
    .pipe gulp.dest('./dev/vendor/fonts/')


# Dirs, Copy, Delete, Mk
gulp.task 'mkdir', (cb) ->
  glob './app/**/' , (err, paths) ->
    async.each paths, (path, acb) ->
      path = path.replace('./app', './dev')
      mkdirp path, ->
        acb()
    , ->
      cb()


gulp.task 'copy', (cb) ->
  glob './app/**' , {nodir: true}, (err, files) ->
    async.each files, (file, acb) ->
      newfile = file.replace('./app', './dev')
      fs.copy file, newfile, (err) ->
        console.log err if err
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


gulp.task 'delete-dev', ->
  gulp.src(['./dev', './tmp'])
    .pipe(clean(force: true))


gulp.task 'removelivereload', ->
  gulp.src('./dev/index.html')
    .pipe deleteLines({
      filters: [
        '<script src="http:\/\/localhost:35729\/livereload\.js"><\/script>'
      ]
    })
    .pipe(gulp.dest('./dev'))


# Coffee, Stylus, Browserify
gulp.task 'coffee', ->
  gulp.src(['./functions/browser.coffee', './functions/deps.coffee'], {base: './'})
    .pipe(coffee(bare: true).on('error', gutil.log))
    .pipe(gulpif(GLOBAL.ifBuild, uglify()))
    .pipe(flatten())
    .pipe gulp.dest('./dev/js/')


gulp.task 'stylus', ->
  gulp.src('./stylesheets/*.styl')
  .pipe(stylus({use: nib(), compress: true}))
  .pipe gulp.dest('./dev/css')


gulp.task 'browserify', (cb) ->
  browserify({
    transform: [coffeeify]
    entries: ['./functions/championify.coffee']
  })
  .bundle()
  .pipe(source('main.js'))
  .pipe(gulpif(GLOBAL.ifBuild, buffer()))
  .pipe(gulpif(GLOBAL.ifBuild, uglify()))
  .pipe(gulp.dest('./dev/js/'))


# Electron Settings
gulp.task 'electron:deps', (cb) ->
  installItems = []
  pkg['electron-deps'].forEach (item) ->
    installItems.push(item+'@'+pkg.dependencies[item])

  cmd = 'npm install ' + installItems.join(' ')
  cmd = cmd + ' --prefix ' + process.cwd() + '/dev'

  exec cmd, (err, std, ste) ->
    console.log(err) if err
    console.log(std)
    console.log(ste) if ste

    cb()

gulp.task 'electron:settings', ->
  gulp.src(['./electron.coffee'], {base: './'})
    .pipe(coffee(bare: true).on('error', gutil.log))
    .pipe(gulpif(GLOBAL.ifBuild, uglify()))
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


# Build
gulp.task 'asar', ->
  gulp.src('./dev/**', {base: './dev/'})
    .pipe(gulpAsar('app.asar'))
    .pipe(gulp.dest('tmp'))


gulp.task 'compile', ->
  version = pkg.devDependencies['electron-prebuilt'].replace(/\^/g, '')
  if process.platform == 'darwin'
    buildCfg = {
      version: version
      platform: 'darwin'
      darwinIcon: './resources/osx/Championify.icns'
      asar: true
    }

  else
    buildCfg = {
      version: version
      platform: 'win32'
      winIcon: './resources/win/Championify.ico'
      companyName: pkg.author
      copyright: [pkg.license, pkg.author, '2015'].join(' ')
      asar: true
    }

  gulp.src(['./dev/package.json', './tmp/app.asar'])
    .pipe atomshell(buildCfg)
    .pipe atomshell.zfsdest(GLOBAL.releaseFile)
    # .pipe gulp.dest('./releases')



# Dev
gulp.task 'run-watch', (cb) ->
  fs.writeFileSync('./dev/dev_enabled', 'dev enabled', 'utf8')
  gulp.watch './stylesheets/*.styl', ['stylus']
  gulp.watch './functions/browser.coffee', ['coffee']
  gulp.watch ['./functions/championify.coffee', './functions/helpers.coffee'], ['browserify']

  cmd = path.normalize('../node_modules/.bin/electron') + ' .'

  console.log cmd
  exec cmd, {'cwd': './dev'},(err, std, ste) ->
    console.log err if err
    process.exit(0)


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
    'compile',
    # 'delete-dev'
  )
