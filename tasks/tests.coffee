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


gulp.task 'mocha', (cb) ->
  env = process.env
  env['ELECTRON_PATH'] = path.resolve('./node_modules/.bin/electron')
  options = {stdio: [process.stdin, process.stdout, process.stderr]}

  cmd = path.resolve('./node_modules/.bin/electron-mocha')
  args = ['--renderer', './tests/']

  if process.platform == 'win32'
    cmd = cmd+'.cmd'
    env['ELECTRON_PATH'] = env['ELECTRON_PATH']+'.cmd'
    env['EXITCODE_PATH'] = path.join(process.cwd(), 'exit.code')
    fs.removeSync(env['EXITCODE_PATH']) if fs.existsSync(env['EXITCODE_PATH'])

  options.env = env

  em = spawn(cmd, args, options)
  em.on 'close', (code) ->
    code = parseInt(fs.readFileSync(env['EXITCODE_PATH'], 'utf8')) if process.platform == 'win32'
    if code != 0
      if _.contains(process.argv, '--appveyor')
        return cb('Mocha returned an error, and it\'s not displayed here because process spawning on Windows sucks balls. See if the error is happening on Travis-CI, otherwise run tests on a local windows system. https://travis-ci.org/dustinblackman/Championify/builds')

      cb('Mocha exited with code: ' + code)
    else
      cb()

gulp.task 'test', (cb) ->
  runSequence('lint', 'mocha', cb)
