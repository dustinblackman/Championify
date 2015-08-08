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


gulp.task 'tarball:osx', (cb) ->
  async.auto {
    rename_app: (step) ->
      renameAsar('app.asar', pkg.name + '.app', 'Contents/Resources', step)
    rename_atom: (step) ->
      renameAsar('atom.asar', pkg.name + '.app', 'Contents/Resources', step)
    move: ['rename_atom', 'rename_app', (step) ->
      fs.move './tmp/' + pkg.name + '.app', './tmp/osx/'+ pkg.name + '.app', (err) ->
        step(err)
    ]
  }, (err) ->
    return cb(err) if err

    stream = fs.createWriteStream('./releases/u_osx.tar.gz')
    stream.on 'close', -> cb()
    tar.pack('./tmp/osx')
      .pipe(zlib.Gzip())
      .pipe(stream)

gulp.task 'tarball:all', (cb) ->
  return runSequence('tarball:osx', cb)
