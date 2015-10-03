require('./_init')
fs = require 'fs-extra'
mkdirp = require 'mkdirp'
path = require 'path'
should = require('chai').should()

pathManager = require '../lib/path_manager'

# Describes based on operating system
osxDescribe = (if process.platform == 'darwin' then describe else describe.skip)
winDescribe = (if process.platform == 'win32' then describe else describe.skip)

describe 'lib/path_manager.coffee', ->
  osxDescribe 'osx: checkInstallPath', ->
    it 'should return an error when an invalid path is given', (done) ->
      test_path = path.resolve('./')
      pathManager.checkInstallPath test_path, (err, selected_path) ->
        should.exist(err)
        err.message.should.equal('Path not found')
        selected_path.should.equal(test_path)
        done()

    it 'should return the correct path when League Of Legends.app is selected', (done) ->
      mkdirp './tmp/League Of Legends.app/Contents/Lol', ->
        test_path = path.resolve('./tmp/League Of Legends.app')

        pathManager.checkInstallPath test_path, (err, selected_path, config_dir) ->
          should.not.exist(err)
          selected_path.should.equal(test_path)
          config_dir.should.equal('Contents/LoL/Config/Champions/')
          done()

    it 'should return the correct path when the Applications directory is selected' , (done) ->
      mkdirp './tmp/League Of Legends.app/Contents/Lol', ->
        test_path = path.resolve('./tmp')

        pathManager.checkInstallPath test_path, (err, selected_path, config_dir) ->
          should.not.exist(err)
          selected_path.should.equal(path.join(test_path, 'League of Legends.app'))
          config_dir.should.equal('Contents/LoL/Config/Champions/')
          done()


  winDescribe 'win: checkInstallPath', ->
    it 'should return an error when an invalid path is given', (done) ->
      test_path = path.resolve('./')
      pathManager.checkInstallPath test_path, (err, selected_path, config) ->
        should.exist(err)
        err.message.should.equal('Path not found')
        selected_path.should.equal(test_path)
        done()

    it 'should return the correct path for a default League installation', (done) ->
      mkdirp './tmp/1/', ->
        fs.writeFileSync('./tmp/1/lol.launcher.exe', '123', 'utf8')
        test_path = path.resolve('./tmp/1/')

        pathManager.checkInstallPath test_path, (err, selected_path, config_dir, executable) ->
          should.not.exist(err)
          selected_path.should.equal(test_path)
          config_dir.should.equal('Config/Champions/')
          executable.should.equal('lol.launcher.exe')
          done()

    it 'should return the correct path for garena check 1 installation', (done) ->
      mkdirp './tmp/2/', ->
        fs.writeFileSync('./tmp/2/lol.exe', '123', 'utf8')
        test_path = path.resolve('./tmp/2/')

        pathManager.checkInstallPath test_path, (err, selected_path, config_dir, executable) ->
          should.not.exist(err)
          selected_path.should.equal(test_path)
          config_dir.should.equal('Game/Config/Champions/')
          executable.should.equal('lol.exe')
          done()

    it 'should return the correct path for garena check 2 installation', (done) ->
      mkdirp './tmp/3/GameData/Apps/LoLTH', ->
        fs.writeFileSync('./tmp/3/LoLTHLauncher.exe', '123', 'utf8')
        test_path = path.resolve('./tmp/3')

        pathManager.checkInstallPath test_path, (err, selected_path, config_dir, executable) ->
          should.not.exist(err)
          selected_path.should.equal(test_path)
          config_dir.should.equal('GameData/Apps/LoLTH/Game/Config/Champions/')
          executable.should.equal('LoLTHLauncher.exe')
          done()
