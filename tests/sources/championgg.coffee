require('../_init')

fs = require 'fs'
nock = require 'nock'
path = require 'path'
should = require('chai').should()
_ = require('lodash')

championgg = require '../../lib/sources/championgg'

nocked = null
FIXTURES = {
  faq: fs.readFileSync path.join(__dirname, 'fixtures/championgg/faq.html')
  champions: JSON.parse fs.readFileSync(path.join(__dirname, '../fixtures/champions.json'))
  brand: fs.readFileSync path.join(__dirname, 'fixtures/championgg/brand.html')
  brand_support: fs.readFileSync path.join(__dirname, 'fixtures/championgg/brand_support.html')
  brand_result: JSON.parse fs.readFileSync(path.join(__dirname, 'fixtures/championgg/brand_result.json'))
}


describe 'lib/sources/championgg.coffee', ->
  before ->
    nocked = nock('http://champion.gg')

  afterEach ->
    nock.cleanAll()

  describe 'getVersion', ->
    it 'should get the stubbed championgg version', (done) ->
      nocked
        .get('/faq/')
        .reply(200, FIXTURES.faq)

      championgg.version (err, version) ->
        should.not.exist(err)
        version.should.equal('5.16')
        done()

  describe 'requestChamps', ->
    it 'should return default middle and support item sets for Brand', (done) ->
      nocked
        .get('/champion/Brand')
        .reply(200, FIXTURES.brand)
        .get('/champion/Brand/support')
        .reply(200, FIXTURES.brand_support)

      championgg.sr (err, results) ->
        should.not.exist(err)
        results.should.eql(FIXTURES.brand_result)
        done()

      , {champs: _.keys(FIXTURES.champions.data)}
