sinon = require 'sinon'
mockery = require 'mockery'
should = require('chai').should()

remoteStub = null
hlp = null

describe 'lib/helpers.coffee', ->
  before ->
    mockery.enable({
      warnOnReplace: false
      warnOnUnregistered: false
      useCleanCache: true
    })

    remoteStub = sinon.stub()
    mockery.registerMock('remote', remoteStub)
    hlp = require '../lib/helpers'

  after ->
    mockery.disable()


  describe 'wins', ->
    it 'should return win precentage', (done) ->
      hlp.wins(1).should.equal('1%')
      done()

  describe 'spliceVersion', ->
    it 'should return a two digit version number', (done) ->
      hlp.spliceVersion('1.2.3').should.equal('1.2')
      done()
