gulp        = require 'gulp'
asar        = require 'gulp-asar'
atomshell   = require 'gulp-atom-shell'

pkg         = require '../package.json'

# Build
gulp.task 'asar', ->
  gulp.src('./dev/**', {base: './dev/'})
    .pipe(asar('app.asar'))
    .pipe(gulp.dest('tmp'))


gulp.task 'compile', ->
  version = pkg.devDependencies['electron-prebuilt'].replace(/\^/g, '')
  if process.platform == 'darwin'
    buildCfg = {
      version: version
      platform: 'darwin'
      darwinIcon: './resources/osx/Championify.icns'
      asar: true
    }

  else
    buildCfg = {
      version: version
      platform: 'win32'
      winIcon: './resources/win/Championify.ico'
      companyName: pkg.author
      copyright: [pkg.license, pkg.author, '2015'].join(' ')
      asar: true
    }

  gulp.src(['./dev/package.json', './tmp/app.asar'])
    .pipe atomshell(buildCfg)
    .pipe atomshell.zfsdest(GLOBAL.releaseFile)
    # .pipe gulp.dest('./releases')

