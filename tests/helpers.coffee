should = require('chai').should()

hlp = require '../lib/helpers'

describe 'lib/helpers.coffee', ->
  describe 'wins', ->
    it 'should return win precentage', ->
      hlp.wins(1).should.equal('1%')

  describe 'spliceVersion', ->
    it 'should return a two digit version number', ->
      hlp.spliceVersion('1.2.3').should.equal('1.2')
