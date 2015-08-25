coffeelint = require 'gulp-coffeelint'
gulp = require 'gulp'
path = require 'path'
runSequence = require 'run-sequence'
stylish = require 'coffeelint-stylish'


gulp.task 'coffeelint', ->
  coffeelint_config = path.resolve(path.join(__dirname, '..', 'coffeelint.json'))
  return gulp.src('./lib/*.coffee')
    .pipe(coffeelint(coffeelint_config))
    .pipe(coffeelint.reporter(stylish))
    .pipe(coffeelint.reporter('failOnWarning'))


gulp.task 'lint', ->
  return runSequence('coffeelint')

gulp.task 'test', ->
  return runSequence('lint')
