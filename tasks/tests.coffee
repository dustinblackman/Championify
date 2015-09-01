coffeelint = require 'gulp-coffeelint'
fs = require 'fs-extra'
gulp = require 'gulp'
htmlhint = require 'gulp-htmlhint'
jsonlint = require 'gulp-jsonlint'
path = require 'path'
runSequence = require 'run-sequence'
shell = require 'gulp-shell'
stylish = require 'coffeelint-stylish'
stylint = require 'gulp-stylint'
spawn = require('child_process').spawn
_ = require 'lodash'


gulp.task 'coffeelint', ->
  coffeelint_config = path.resolve(path.join(__dirname, '..', 'coffeelint.json'))
  return gulp.src([
      './electron.coffee'
      './gulpfile.coffee'
      './lib/**/*.coffee'
      './tasks/**/*.coffee'
      './tests/**/*.coffee'
    ])
    .pipe(coffeelint(coffeelint_config))
    .pipe(coffeelint.reporter(stylish))
    .pipe(coffeelint.reporter('failOnWarning'))

gulp.task 'stylint', ->
  stylint_config = path.resolve(path.join(__dirname, '..', '.stylintrc'))
  return gulp.src('stylesheets/**/*.styl')
    .pipe(stylint({
      config: stylint_config
      failOnError: true
      reporter: 'stylint-stylish'
    }))

gulp.task 'htmlhint', ->
  return gulp.src('app/**/*.html')
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.reporter('htmlhint-stylish'))
    .pipe(htmlhint.failReporter({suppress: true}))

gulp.task 'jsonlint', ->
  return gulp.src([
      './data/**/*.json'
      './.htmlhintrc'
      './.stylintrc'
      './coffeelint.json'
      './package.json'
      './bower.json'
    ])
    .pipe(jsonlint())
    .pipe(jsonlint.failOnError())


gulp.task 'lint', (cb) ->
  runSequence('coffeelint', 'stylint', 'jsonlint', cb)


mochaWindows = (cb) ->
  options = {stdio: [process.stdin, process.stdout, process.stderr]}
  env = process.env
  env['ELECTRON_PATH'] = path.resolve('./node_modules/.bin/electron')+'.cmd'
  env['EXITCODE_PATH'] = path.join(process.cwd(), 'exit.code')
  options.env = env

  cmd = path.resolve('./node_modules/.bin/electron-mocha') +'.cmd'
  args = ['--renderer', './tests/']

  fs.removeSync(env['EXITCODE_PATH']) if fs.existsSync(env['EXITCODE_PATH'])

  em = spawn(cmd, args, options)
  em.on 'close', (code) ->
    code = parseInt(fs.readFileSync(env['EXITCODE_PATH'], 'utf8'))
    if code != 0
      if _.contains(process.argv, '--appveyor')
        return cb('Mocha returned an error, and it\'s not displayed here because process spawning on Windows sucks balls. See if the error is happening on Travis-CI, otherwise run tests on a local windows system. https://travis-ci.org/dustinblackman/Championify/builds')

      cb('Mocha exited with code: ' + code)
    else
      cb()


mochaOSX = (cb) ->
  options = {stdio: [process.stdin, process.stdout, process.stderr]}
  env = process.env
  env['ELECTRON_PATH'] = path.resolve('./node_modules/.bin/electron')
  options.env = env

  cmd = path.resolve('./node_modules/.bin/electron-mocha')

  # if _.contains(process.argv, '--travis')
  #   env.NODE_ENV = 'test'
  #   env.CHAMPIONIFY_COVERAGE = 1
  #   args = '--require blanket --reporter mocha-lcov-reporter --renderer ./tests/ | ./node_modules/coveralls/bin/coveralls.js'
  # else
  #   args = '--renderer ./tests/'

  args = ['--renderer', './tests/']

  em = spawn(cmd, args, options)
  em.on 'close', (code) ->
    return cb('Mocha exited with code: ' + code) if code != 0
    cb()


gulp.task 'mocha', (cb) ->
  if process.platform == 'win32'
    mochaWindows(cb)
  else
    mochaOSX(cb)


gulp.task 'test', (cb) ->
  runSequence('lint', 'mocha', cb)
