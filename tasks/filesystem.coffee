gulp        = require 'gulp'
async       = require 'async'
path        = require 'path'
mkdirp      = require 'mkdirp'
fs          = require 'fs-extra'
clean       = require 'gulp-clean'
glob        = require 'glob'

# Dirs, Copy, Delete, Mk
gulp.task 'mkdir', (cb) ->
  glob './app/**/' , (err, paths) ->
    async.each paths, (path, acb) ->
      path = path.replace('./app', './dev')
      mkdirp path, ->
        acb()
    , ->
      cb()


gulp.task 'copy', (cb) ->
  glob './app/**' , {nodir: true}, (err, files) ->
    async.each files, (file, acb) ->
      newfile = file.replace('./app', './dev')
      fs.copy file, newfile, (err) ->
        console.log err if err
        acb()
    , ->
      cb()


gulp.task 'symlink', (cb) ->
  glob './app/**', {nodir: true} , (err, paths) ->
    async.each paths, (oldPath, acb) ->
      newPath = oldPath.replace('./app', './dev')
      oldPath = oldPath.replace('./app/', process.cwd()+'/app/')
      fs.symlink oldPath, newPath, (err) ->
        acb null
    , () ->
      cb()


gulp.task 'delete-dev', ->
  gulp.src(['./dev', './tmp'])
    .pipe(clean(force: true))