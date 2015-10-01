fs = require 'fs-extra'
path = require 'path'
should = require('chai').should()

preferences = require '../lib/preferences'
prefs_fixture = {dir: '/123'}

describe 'lib/preferences.coffee', ->
  describe 'directory', ->
    it 'should return the preferences directory depending on the platform', ->
      if process.platform == 'darwin'
        pref_dir = path.join(process.env.HOME, 'Library/Application Support/Championify/')
      else
        pref_dir = path.join(process.env.APPDATA, 'Championify')
      preferences.directory().should.equal(pref_dir)

  describe 'file', ->
    it 'should return the preferences directory depending on the platform', ->
      if process.platform == 'darwin'
        pref_file = path.join(process.env.HOME, 'Library/Application Support/Championify/prefs.json')
      else
        pref_file = path.join(process.env.APPDATA, 'Championify/prefs.json')
      preferences.file().should.equal(pref_file)

  describe 'save', ->
    it 'should save preferences fixture', (done) ->
      preferences.save prefs_fixture, (err) ->
        should.not.exist(err)
        fs.existsSync(preferences.file()).should.equal(true)
        done()

  describe 'load', ->
    it 'should load preferences fixture', (done) ->
      preferences.load().should.eql(prefs_fixture)
      done()

    it 'should return null when no preferences exist', (done) ->
      fs.removeSync(preferences.file())
      should.not.exist(preferences.load())
      done()
