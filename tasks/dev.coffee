gulp = require 'gulp'
deleteLines = require 'gulp-delete-lines'
fs = require 'fs-extra'
path = require 'path'
spawn = require('child_process').spawn


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
  gulp.watch './lib/*.coffee', ['coffee']

  current_process = spawn(path.normalize('../node_modules/.bin/electron'), ['.'], {'cwd': './dev'})
  current_process.on 'close', (code) ->
    console.log('child process exited with code ' + code);
    process.exit(0)
