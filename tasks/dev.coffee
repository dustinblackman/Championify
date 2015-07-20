gulp = require 'gulp'
deleteLines = require 'gulp-delete-lines'
fs = require 'fs-extra'
path = require 'path'
exec = require('child_process').exec


gulp.task 'removelivereload', ->
  gulp.src('./dev/index.html')
    .pipe deleteLines({
      filters: [
        '<script src="http:\/\/localhost:35729\/livereload\.js"><\/script>'
      ]
    })
    .pipe(gulp.dest('./dev'))


# Dev
gulp.task 'run-watch', (cb) ->
  fs.writeFileSync('./dev/dev_enabled', 'dev enabled', 'utf8')
  gulp.watch './stylesheets/*.styl', ['stylus']
  gulp.watch ['./lib/main.coffee', './lib/errors.coffee'], ['coffee']
  gulp.watch ['./lib/*.coffee', '!./lib/main.coffee'], ['browserify']

  cmd = path.normalize('../node_modules/.bin/electron') + ' .'

  console.log cmd
  exec cmd, {'cwd': './dev'},(err, std, ste) ->
    console.log err if err
    process.exit(0)
