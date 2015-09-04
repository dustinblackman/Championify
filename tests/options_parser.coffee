mockery = require 'mockery'
should = require('chai').should()

optionsParser = null

describe 'lib/options_parser.coffee', ->
  before ->
    mockery.enable({
      warnOnReplace: false
      warnOnUnregistered: false
      useCleanCache: true
    })

    remoteStub = {process: {argv: []}}
    mockery.registerMock('remote', remoteStub)
    optionsParser = require '../lib/options_parser'

  describe 'import', ->
    it 'should return false', (done) ->
      optionsParser.import().should.equal(false)
      done()

  describe 'delete', ->
    it 'should return false', (done) ->
      optionsParser.delete().should.equal(false)
      done()

  describe 'close', ->
    it 'should return false', (done) ->
      optionsParser.close().should.equal(false)
      done()

  describe 'autorun', ->
    it 'should return false', (done) ->
      optionsParser.autorun().should.equal(false)
      done()

  describe 'runnedAsAdmin', ->
    it 'should return false', (done) ->
      optionsParser.runnedAsAdmin().should.equal(false)
      done()

  describe 'startLeague', ->
    it 'should return false', (done) ->
      optionsParser.startLeague().should.equal(false)
      done()
