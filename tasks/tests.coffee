coffeelint = require 'gulp-coffeelint'
fs = require 'fs-extra'
gulp = require 'gulp'
htmlhint = require 'gulp-htmlhint'
jsonlint = require 'gulp-jsonlint'
mocha = require 'gulp-mocha'
open = require 'open'
path = require 'path'
runSequence = require 'run-sequence'
shell = require 'gulp-shell'
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
  runSequence('coffeelint', 'stylint', 'jsonlint', cb)

gulp.task 'mocha', ->
  gulp.src('./tests/*.coffee').pipe mocha({require: ['./helpers/register-istanbul.js']})

gulp.task 'istanbul', ->
  gulp.src('').pipe shell("#{path.resolve('./node_modules/.bin/istanbul')} report lcov text-summary")

gulp.task 'coverage', (cb) ->
  open path.resolve(path.join(__dirname, '../coverage/lcov-report/index.html'))
  cb()

gulp.task 'test', (cb) ->
  runSequence('lint', 'mocha', cb)
