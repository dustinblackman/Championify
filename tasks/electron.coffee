async = require 'async'
coffee = require 'gulp-coffee'
exec = require('child_process').exec
fs = require 'fs-extra'
gulp = require 'gulp'
gulpif = require 'gulp-if'
gutil = require 'gulp-util'
mkdirp = require 'mkdirp'
path = require 'path'
request = require 'request'
runSequence = require 'run-sequence'
shell = require 'gulp-shell'
uglify = require 'gulp-uglify'
yauzl = require 'yauzl'
_ = require 'lodash'

pkg = require '../package.json'
downloadLink = _.template('https://github.com/atom/electron/releases/download/v${version}/electron-v${version}-${os}-${arch}.zip')


_modeFromEntry = (entry) ->
  attr = entry.externalFileAttributes >> 16 or 33188
  [448, 56, 7].map (mask) ->
    attr & mask
  .reduce (a, b) ->
    a + b
  , attr & 61440


_mtimeFromEntry = (entry) ->
  yauzl.dosDateTimeToDate entry.lastModFileDate, entry.lastModFileTime


_processZipEntry = (zip, dest, entry, done) ->
  stat = new (fs.Stats)
  stat.mode = _modeFromEntry(entry)
  stat.mtime = _mtimeFromEntry(entry)

  if stat.isDirectory()
    mkdirp path.join(dest, entry.fileName)
    return done()

  else if stat.isFile()
    zip.openReadStream entry, (err, readStream) ->
      return done(err) if err

      file_dest = path.join(dest, entry.fileName)

      # For some reason when extracting Windows archives, the directory is never listed by itself.
      # We gotta catch it before a write_stream is created.
      dest_dir = path.parse(file_dest).dir
      mkdirp dest_dir if !fs.existsSync(dest_dir)

      write_stream = fs.createWriteStream(file_dest)
      readStream.pipe write_stream
      write_stream.on 'finish', ->
        exec('chmod +x "' + file_dest + '"') if stat.mode == 33261
        return done()

  else if stat.isSymbolicLink()
    zip.openReadStream entry, (err, readStream) ->
      return done(err) if err

      symlink_path = ''
      readStream.on 'data', (c) -> symlink_path += c
      readStream.on 'end', ->
        fs.symlinkSync symlink_path, path.join(dest, entry.fileName)
        return done()
      readStream.on 'error', (err) ->
        return done(err) if err


_zipExtract = (zipfile, dest, done) ->
  if _.isFunction(dest)
    done = dest
    dest = './'

  yauzl.open zipfile, {autoClose: false}, (err, zip) ->
    return done(err) if err
    wasError = null

    # Create destination directory
    mkdirp dest

    # Startup Queue
    Q = async.queue (entry, next) ->
      _processZipEntry zip, dest, entry, (err) ->
        if err
          console.log err
          wasError = true
        next()
    , 10000 # Yolo.

    # Interate zip
    zip.on 'entry', (entry) ->
      Q.push(entry) if !wasError

    zip.on 'end', ->
      close = ->
        zip.close()
        return done(wasError)

      return close() if !Q.length()
      Q.drain = close


# Download Electron ZIP
download = (url, download_path, done) ->
  return done() if fs.existsSync(download_path)
  console.log 'Downloading: ' + path.basename(url)

  try
    file = fs.createWriteStream(download_path)
  catch e
    done(e)

  request(url)
    .pipe(file)
    .on 'error', (err) -> return done(err)
    .on 'close', ->
      file.close()
      done()


# Extract Electron Zip
extract = (download_path, os, done) ->
  folder_name = os + pkg.devDependencies['electron-prebuilt'].replace(/\./g, '-')
  cache_path = path.join('./cache', folder_name)
  return done() if fs.existsSync(cache_path)

  console.log 'Extracting: ' + download_path
  mkdirp cache_path
  _zipExtract download_path, cache_path, (err) ->
    return done(err) if (err)

    license_file = path.join('./cache', folder_name, 'LICENSE')
    fs.removeSync(license_file) if fs.existsSync(license_file)
    done()


# Check cache for electron and download if needed.
cache = (os, arch, done) ->
  mkdirp './cache'

  download_link = downloadLink({
    version: pkg.devDependencies['electron-prebuilt']
    os: os
    arch: arch
  })

  zip_name = path.basename(download_link)
  download_path = path.join('./cache', zip_name)

  async.series [
    (step) -> download(download_link, download_path, step)
    (step) -> extract(download_path, os, step)
  ], (err) -> done(err)


# Electron Settings
gulp.task 'electron:deps', (cb) ->
  install_items = []
  _.each _.keys(pkg.dependencies), (item) ->
    if _.contains(pkg.dependencies[item], 'git://')
      install_items.push pkg.dependencies[item]
    else
      install_items.push item+'@'+pkg.dependencies[item]

  return gulp.src('')
    .pipe shell(['npm install --prefix ./dev ' + install_items.join(' ')])


gulp.task 'electron:settings', ->
  gulp.src(['./electron.coffee'], {base: './'})
    .pipe(coffee(bare: true).on('error', gutil.log))
    # .pipe(gulpif(GLOBAL.ifRelease, uglify({mangle: false})))
    .pipe gulp.dest('./dev')


gulp.task 'electron:packagejson', (cb) ->
  packagejson = {
    name: pkg.name
    version: pkg.version
    main: 'electron.js'
    electron_version: pkg.dependencies['electron-prebuilt']
    release_file_template: pkg.release_file_template
  }
  json = JSON.stringify(packagejson, null, 2)
  fs.writeFile './dev/package.json', json, 'utf8', (err) ->
    console.log err if err
    cb()


gulp.task 'electron:download:mac', (cb) ->
  cache('darwin', 'x64', cb)

gulp.task 'electron:download:win', (cb) ->
  cache('win32', 'ia32', cb)

gulp.task 'electron:download', (cb) ->
  if process.platform == 'darwin'
    runSequence('electron:download:mac', cb)
  else
    runSequence('electron:download:win', cb)
