coffeelint = require 'gulp-coffeelint'
gulp = require 'gulp'
jsonlint = require 'gulp-jsonlint'
path = require 'path'
runSequence = require 'run-sequence'
stylish = require 'coffeelint-stylish'
stylint = require 'gulp-stylint'


gulp.task 'coffeelint', ->
  coffeelint_config = path.resolve(path.join(__dirname, '..', 'coffeelint.json'))
  return gulp.src(['./lib/*.coffee', './electron.coffee'])
    .pipe(coffeelint(coffeelint_config))
    .pipe(coffeelint.reporter(stylish))
    .pipe(coffeelint.reporter('failOnWarning'))


gulp.task 'stylint', ->
  stylint_config = path.resolve(path.join(__dirname, '..', '.stylintrc'))
  return gulp.src('stylesheets/*.styl')
    .pipe(stylint({
      config: stylint_config
      failOnError: true
      reporter: 'stylint-stylish'
    }))

gulp.task 'jsonlint', ->
  return gulp.src('./app/data/*.json')
    .pipe(jsonlint())
    .pipe(jsonlint.failOnError())


gulp.task 'lint', ->
  return runSequence('coffeelint', 'stylint', 'jsonlint')

gulp.task 'test', ->
  return runSequence('lint')
