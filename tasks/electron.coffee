async = require 'async'
coffee = require 'gulp-coffee'
fs = require 'fs-extra'
gulp = require 'gulp'
gulpif = require 'gulp-if'
gutil = require 'gulp-util'
https = require('follow-redirects').https
mkdirp = require 'mkdirp'
npm = require 'npm'
path = require 'path'
runSequence = require 'run-sequence'
uglify = require 'gulp-uglify'
zipz = require '../lib/zipz'
_ = require 'lodash'

pkg = require '../package.json'
downloadLink = _.template('https://github.com/atom/electron/releases/download/v${version}/electron-v${version}-${os}-${arch}.zip')


# Download Electron ZIP
download = (url, download_path, done) ->
  return done() if fs.existsSync(download_path)
  console.log 'Downloading: ' + path.basename(url)

  try
    file = fs.createWriteStream(download_path)
  catch e
    done(e)

  https.get url, (res) ->
    res.pipe file
    file.on 'error', (err) ->
      done(err)
    file.on 'finish', ->
      file.close()
      done()


# Extract Electron Zip
extract = (download_path, os, done) ->
  folder_name = os + pkg.devDependencies['electron-prebuilt'].replace(/\./g, '-')
  cache_path = path.join('./cache', folder_name)
  return done() if fs.existsSync(cache_path)

  console.log 'Extracting: ' + download_path
  mkdirp cache_path
  zipz.extract download_path, cache_path, (err) ->
    return done(err) if (err)
    done()


# Check cache for electron and download if needed.
cache = (os, arch, done) ->
  mkdirp './cache'

  download_link = downloadLink({
    version: pkg.devDependencies['electron-prebuilt']
    os: os,
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

  process.chdir './dev'
  npm.load ->
    npm.commands.install install_items, (err, data) ->
      return cb(err) if err
      process.chdir '..'
      cb()


gulp.task 'electron:settings', ->
  gulp.src(['./electron.coffee'], {base: './'})
    .pipe(coffee(bare: true).on('error', gutil.log))
    .pipe(gulpif(GLOBAL.ifRelease, uglify({mangle: false})))
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
