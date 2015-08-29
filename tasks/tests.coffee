coffeelint = require 'gulp-coffeelint'
gulp = require 'gulp'
htmlhint = require 'gulp-htmlhint'
jsonlint = require 'gulp-jsonlint'
path = require 'path'
runSequence = require 'run-sequence'
shell = require 'gulp-shell'
stylish = require 'coffeelint-stylish'
stylint = require 'gulp-stylint'


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


gulp.task 'mocha', ->
  options = null
  if process.platform == 'win32'
    electron_path = path.resolve('./node_modules/.bin/electron-mocha')
    cmd = [
      'echo Booting up Electron...'
      'echo ELECTRON_PATH=%ELECTRON_PATH%'
      "echo \"#{electron_path}\" --renderer ./tests/"
      "\"#{electron_path}\" --renderer ./tests/"
    ].join(' && ')
    options = {
      env: {ELECTRON_PATH: './node_modules/.bin/electron'}
    }
  else
    cmd = 'ELECTRON_PATH=./node_modules/.bin/electron ./node_modules/.bin/electron-mocha --renderer ./tests/'

  return gulp.src('').pipe shell(cmd, options)


gulp.task 'test', (cb) ->
  runSequence('lint', 'mocha', cb)
