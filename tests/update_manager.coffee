fs = require 'fs'
nock = require 'nock'
should = require('chai').should()

updateManager = require '../src/update_manager'
pkg = JSON.parse fs.readFileSync('./package.json')
nocked = null

describe 'src/update_manager.coffee', ->
  before ->
    nocked = nock('https://raw.githubusercontent.com')

  describe 'check', ->
    it 'should say no update is required', (done) ->
      nocked
        .get('/dustinblackman/Championify/master/package.json')
        .reply(200, pkg)

      updateManager.check (version, is_major) ->
        version.should.equal(false)
        is_major.should.equal(false)
        done()

    it 'should say a minor update is required', (done) ->
      pkg.version = '100.0.0'
      nocked
        .get('/dustinblackman/Championify/master/package.json')
        .reply(200, pkg)

      updateManager.check (version, is_major) ->
        version.should.equal(pkg.version)
        is_major.should.equal(false)
        done()

    it 'should say a major update is required', (done) ->
      pkg.devDependencies['electron-prebuilt'] = '100.0.0'
      nocked
        .get('/dustinblackman/Championify/master/package.json')
        .reply(200, pkg)

      updateManager.check (version, is_major) ->
        version.should.equal(pkg.version)
        is_major.should.equal(true)
        done()
