should = require('chai').should()

optionsParser = require '../src/options_parser'

describe 'src/options_parser.coffee', ->
  describe 'import', ->
    it 'should return false', ->
      optionsParser.import().should.equal(false)

  describe 'delete', ->
    it 'should return false', ->
      optionsParser.delete().should.equal(false)

  describe 'close', ->
    it 'should return false', ->
      optionsParser.close().should.equal(false)

  describe 'autorun', ->
    it 'should return false', ->
      optionsParser.autorun().should.equal(false)

  describe 'runnedAsAdmin', ->
    it 'should return false', ->
      optionsParser.runnedAsAdmin().should.equal(false)

  describe 'startLeague', ->
    it 'should return false', ->
      optionsParser.startLeague().should.equal(false)
