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
  gulp.watch './src/**/*.js', ['babel']
  if process.platform == 'win32'
    gulp.watch './app/**', ['copy:app']

  exec_path = path.resolve('node_modules/.bin/electron')
  exec_path = exec_path + '.cmd' if process.platform == 'win32'

  current_process = spawn(exec_path, ['.'], {'cwd': './dev'})
  current_process.on 'close', (code) ->
    console.log("child process exited with code #{code}")
    process.exit(0)
