async = require 'async'
asar = require 'gulp-asar'
fs = require 'fs-extra'
gulp = require 'gulp'
inno = require 'gulp-inno'
moment = require 'moment'
path = require 'path'
plist = require 'plist'
runSequence = require 'run-sequence'
rcedit = require 'rcedit'
_ = require 'lodash'

pkg = require '../package.json'
electron_version = pkg.devDependencies['electron-prebuilt']

copyright = ->
  return [
    'Copyright (C)'
    moment().format('YYYY')
    pkg.author + '.'
    'All rights reserved'
  ].join(' ')


# Build
gulp.task 'asar', ->
  gulp.src('./dev/**', {base: './dev/'})
    .pipe(asar('app.asar'))
    .pipe(gulp.dest('tmp'))


gulp.task '_compileMac', (cb) ->
  src_folder = 'darwin' + electron_version.replace(/\./g, '-')
  tmp_path = path.join('./tmp', pkg.name + '.app')

  async.auto {
    electron: (step) ->
      fs.copy path.join('./cache', src_folder, 'Electron.app'), tmp_path, (err) ->
        step(err)
    asar: ['electron', (step) ->
      fs.copy './tmp/app.asar', path.join(tmp_path, 'Contents/Resources/app.asar'), (err) ->
        step(err)
    ]
    icns: ['electron', (step) ->
      fs.removeSync path.join(tmp_path, 'Contents/Resources/atom.icns')
      fs.copy './resources/osx/icon.icns', path.join(tmp_path, '/Contents/Resources/Championify.icns'), (err) ->
        step(err)
    ]
    executable: ['electron', (step) ->
      fs.move path.join(tmp_path, 'Contents/MacOS/Electron'), path.join(tmp_path, 'Contents/MacOS/', pkg.name), (err) ->
        step(err)
    ]
    plist: ['electron', (step) ->
      info_plist = plist.parse fs.readFileSync(path.join(tmp_path, 'Contents/Info.plist'), 'utf8')
      info_plist['CFBundleExecutable'] = pkg.name
      info_plist['CFBundleName'] = pkg.name
      info_plist['CFBundleDisplayName'] = pkg.name
      info_plist['CFBundleVersion'] = pkg.version
      info_plist['CFBundleShortVersionString'] = pkg.version
      info_plist['CFBundleIconFile'] = pkg.name + '.icns'
      info_plist['NSHumanReadableCopyright'] = copyright()
      fs.writeFile path.join(tmp_path, 'Contents/Info.plist'), plist.build(info_plist), {encoding: 'utf8'}, (err) ->
        step(err)
    ],
    remove_default: ['electron', (step) ->
      fs.remove path.join(tmp_path, 'Contents/Resources/default_app'), (err) ->
        step(err)
    ]
  }, (err) -> cb(err)

gulp.task 'compile:mac', (cb) ->
  return runSequence('electron:download:mac', '_compileMac', cb)

gulp.task '_compileWin', (cb) ->
  src_folder = 'win32' + electron_version.replace(/\./g, '-')
  tmp_path = path.join('./tmp/', pkg.name)
  exe_path = path.join(tmp_path, pkg.name.toLowerCase() + '.exe')

  async.auto {
    electron: (step) ->
      fs.copy path.join('./cache', src_folder), tmp_path, (err) ->
        step(err)
    asar: ['electron', (step) ->
      fs.copy './tmp/app.asar', path.join(tmp_path, 'resources/app.asar'), (err) ->
        step(err)
    ]
    remove_default: ['electron', (step) ->
      fs.remove path.join(tmp_path, '/resources/default_app'), (err) ->
        step(err)
    ]
    rename: ['electron', (step) ->
      fs.move path.join(tmp_path, 'electron.exe'), exe_path, (err) ->
        step(err)
    ]
    rcedit: ['electron', 'rename', (step) ->
      patch = {
        icon: './resources/win/icon.ico'
        'version-string': {
          CompanyName: pkg.author
          FileDescription: pkg.name
          LegalCopyright: copyright()
          ProductName: pkg.name
          ProductVersion: pkg.version
        }
      }
      rcedit exe_path, patch, (err) ->
        step(err)
    ]
  }, (err) -> cb(err)


gulp.task 'compile:win', (cb) ->
  return runSequence('electron:download:win', '_compileWin', cb)


gulp.task '_wininstaller', ->
  inno_script = _.template(fs.readFileSync('./resources/win/inno_script.iss'))

  dataPath = path.resolve('./tmp/'+pkg.name).replace(/\//g,'\\')
  releasePath = process.cwd().replace(/\//g,'\\') + '\\releases'
  if process.platform != 'win32'
    releasePath = 'Z:'+releasePath
    dataPath = 'Z:'+dataPath

  inno_compiled = inno_script({
    version: pkg.version
    description: pkg.description
    url: pkg.repository.url
    outputPath: releasePath
    exe: pkg.name
    dataPath: dataPath
  })

  fs.writeFileSync './tmp/installerscript.iss', inno_compiled, {encoding: 'utf8'}
  return gulp.src('./tmp/installerscript.iss').pipe(inno())


gulp.task 'compile:win-installer', (cb) ->
  if fs.existsSync './tmp/' + pkg.name
    return runSequence('_wininstaller', cb)
  else
    return runSequence('package-asar', 'compile:win', '_wininstaller', cb)

# TODO Deprecated.
gulp.task 'compile', (cb) ->
  if process.platform == 'darwin'
    runSequence('compile:mac', cb)
  else
    runSequence('compile:win', cb)


gulp.task 'compile:all', (cb) ->
  runSequence(['compile:mac', 'compile:win'], 'compile:win-installer', cb)
