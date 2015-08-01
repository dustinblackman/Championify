gulp = require 'gulp'
asar = require 'gulp-asar'
atomshell = require 'gulp-atom-shell'
runSequence = require 'run-sequence'
path = require 'path'
AdmZip = require 'adm-zip'
inno = require 'gulp-inno'
_ = require 'lodash'
fs = require 'fs-extra'

pkg = require '../package.json'
electron_version = pkg.devDependencies['electron-prebuilt'].replace(/\^/g, '')

# Build
gulp.task 'asar', ->
  gulp.src('./dev/**', {base: './dev/'})
    .pipe(asar('app.asar'))
    .pipe(gulp.dest('tmp'))


gulp.task 'compile:win', ->
  buildCfg = {
    version: electron_version
    platform: 'win32'
    winIcon: path.normalize('./resources/win/icon.ico')
    companyName: pkg.author
    copyright: [pkg.license, pkg.author, '2015'].join(' ')
    asar: true
  }

  gulp.src(['./dev/package.json', './tmp/app.asar'])
    .pipe atomshell(buildCfg)
    .pipe atomshell.zfsdest(GLOBAL.releaseFile({platform: 'Windows', version: pkg.version}))


gulp.task 'compile:mac', ->
  buildCfg = {
    version: electron_version
    platform: 'darwin'
    darwinIcon: './resources/osx/icon.icns'
    asar: true
  }

  gulp.src(['./dev/package.json', './tmp/app.asar'])
    .pipe atomshell(buildCfg)
    .pipe atomshell.zfsdest(GLOBAL.releaseFile({platform: 'OSX', version: pkg.version}))


gulp.task 'compile:win-installer', ->
  zip = new AdmZip GLOBAL.releaseFile({platform: 'Windows', version: pkg.version})
  zip.extractAllTo './tmp/championify_windows', true

  inno_script = _.template(fs.readFileSync('./resources/win/inno_script.iss'))

  dataPath = path.resolve('./tmp/championify_windows').replace(/\//g,'\\')
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



gulp.task 'compile', (cb) ->
  if process.platform == 'darwin'
    runSequence('compile:mac', cb)
  else
    runSequence('compile:win', cb)


gulp.task 'compile:all', (cb) ->
  runSequence('compile:mac', 'compile:win', 'compile:win-installer', cb)
