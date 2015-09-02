should = require('chai').should()

optionsParser = require '../lib/options_parser'

describe 'lib/options_parser.coffee', ->
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
