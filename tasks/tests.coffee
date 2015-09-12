coffeelint = require 'gulp-coffeelint'
fs = require 'fs-extra'
gulp = require 'gulp'
htmlhint = require 'gulp-htmlhint'
jadelint = require 'gulp-jadelint'
jsonlint = require 'gulp-jsonlint'
open = require 'open'
path = require 'path'
runSequence = require 'run-sequence'
shell = require 'gulp-shell'
spawn = require('child_process').spawn
stylish = require 'coffeelint-stylish'
stylint = require 'gulp-stylint'
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

gulp.task 'jadelint', ->
  return gulp.src('views/*.jade')
    .pipe(jadelint())

gulp.task 'jsonlint', ->
  return gulp.src([
      './data/**/*.json'
      './i18n/**/*.json'
      './.htmlhintrc'
      './.stylintrc'
      './coffeelint.json'
      './package.json'
      './bower.json'
    ])
    .pipe(jsonlint())
    .pipe(jsonlint.reporter())
    .pipe(jsonlint.failAfterError())


gulp.task 'lint', (cb) ->
  runSequence('coffeelint', 'stylint', 'htmlhint', 'jadelint', 'jsonlint', cb)


mochaWindows = (cb) ->
  # TODO: Fix so Mocha results are shown in Appveyor.
  if _.contains(process.argv, '--appveyor')
    console.log('Note: You can\'t see Mocha test results in AppVeyor due to how Windows spawns processes, and coverage reports are incorrect.')

  options = {stdio: [process.stdin, process.stdout, process.stderr], env: process.env}
  options.env.ELECTRON_PATH = "#{path.resolve('./node_modules/.bin/electron')}.cmd"
  options.env.EXITCODE_PATH = path.join process.cwd(), 'exit.code'

  cmd = "#{path.resolve('./node_modules/.bin/electron-mocha')}.cmd"
  args = ['--renderer', './tests/']

  fs.removeSync(options.env.EXITCODE_PATH) if fs.existsSync(options.env.EXITCODE_PATH)

  em = spawn(cmd, args, options)
  em.on 'close', (code) ->
    code = parseInt(fs.readFileSync(options.env.EXITCODE_PATH, 'utf8'))
    fs.removeSync(options.env.EXITCODE_PATH)
    if code != 0
      if _.contains(process.argv, '--appveyor')
        return cb('Mocha returned an error, and it\'s not displayed here because process spawning on Windows sucks balls. See if the error is happening on Travis-CI, otherwise run tests on a local windows system. https://travis-ci.org/dustinblackman/Championify/builds')

      cb("Mocha exited with code: #{code}")
    else
      cb()


mochaOSX = (cb) ->
  options = {stdio: [process.stdin, process.stdout, process.stderr], env: process.env}
  options.env.ELECTRON_PATH = path.resolve('./node_modules/.bin/electron')

  electron_mocha = path.resolve('./node_modules/.bin/electron-mocha')
  args = ['--require', './helpers/register-istanbul.js', '--renderer', './tests/']

  em = spawn(electron_mocha, args, options)
  em.on 'close', (code) ->
    return cb("Mocha exited with code: #{code}") if code != 0
    cb()


gulp.task 'mocha', (cb) ->
  if process.platform == 'win32'
    mochaWindows(cb)
  else
    mochaOSX(cb)

gulp.task 'istanbul', ->
  gulp.src('').pipe shell("#{path.resolve('./node_modules/.bin/istanbul')} report lcov text-summary")

gulp.task 'coverage', (cb) ->
  open path.resolve(path.join(__dirname, '../coverage/lcov-report/index.html'))
  cb()

gulp.task 'test', (cb) ->
  runSequence('lint', 'mocha', 'istanbul', cb)
