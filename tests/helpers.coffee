should = require('chai').should()

hlp = require '../lib/helpers'

describe 'lib/helpers', ->
  it 'should return win precentage', (cb) ->
    hlp.wins(1).should.equal('1%')
    cb()
