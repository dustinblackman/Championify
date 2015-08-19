async = require 'async'
fs = require 'fs-extra'
gulp = require 'gulp'
path = require 'path'
runSequence = require 'run-sequence'
tar = require 'tar-fs'
zlib = require 'zlib'

pkg = require '../package.json'

renameAsar = (asar, pkg_name, resource_path, done) ->
  root = path.join('./tmp', pkg_name, resource_path)
  src = path.join(root, asar)
  dest = path.join(root, asar.replace(/\./g, '-'))
  fs.move src, dest, {clobber: true}, (err) ->
    console.log('There was a stupid error') if err
    console.log(err) if err
    done(err)


tarball = (os, done) ->
  if os == 'osx'
    pkg_name = pkg.name + '.app'
    resources_folder = 'Contents/Resources'
  else
    pkg_name = pkg.name
    resources_folder = 'resources'

  os_tmp_path = path.join('./tmp', os)

  async.auto {
    rename_app: (step) ->
      renameAsar('app.asar', pkg_name, resources_folder, step)
    rename_atom: (step) ->
      renameAsar('atom.asar', pkg_name, resources_folder, step)
    move: ['rename_atom', 'rename_app', (step) ->
      fs.move path.join('./tmp', pkg_name), path.join(os_tmp_path, pkg_name), (err) ->
        step(err)
    ]
  }, (err) ->
    return cb(err) if err

    stream = fs.createWriteStream('./releases/u_' + os + '.tar.gz')
    stream.on 'close', -> done()
    tar.pack(os_tmp_path)
      .pipe(zlib.Gzip())
      .pipe(stream)


gulp.task 'tarball:osx', (cb) ->
  tarball('osx', cb)

gulp.task 'tarball:win', (cb) ->
  tarball('win', cb)

gulp.task 'tarball:all', (cb) ->
  return runSequence(['tarball:osx', 'tarball:win'], cb)
