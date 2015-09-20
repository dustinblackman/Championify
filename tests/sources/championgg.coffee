require('../_init')

fs = require 'fs'
nock = require 'nock'
path = require 'path'
should = require('chai').should()
_ = require('lodash')

championgg = require '../../lib/sources/championgg'

nocked = null
loadFixture = (file_name) ->
  data = fs.readFileSync path.join(__dirname, "fixtures/championgg/#{file_name}")
  data = JSON.parse(data) if _.contains(file_name, '.json')
  return data

FIXTURES = {
  champions: JSON.parse fs.readFileSync(path.join(__dirname, '../fixtures/champions.json'))
  faq: loadFixture('faq.html')
  brand: loadFixture('brand.html')
  brand_support: loadFixture('brand_support.html')
  brand_result_default: loadFixture('brand_result_default.json')
  brand_result_splititems: loadFixture('brand_result_splititems.json')
  brand_result_consumables_beginning: loadFixture('brand_result_consumables_beginning.json')
  brand_result_consumables_end: loadFixture('brand_result_consumables_end.json')
  brand_result_trinkets_beginning: loadFixture('brand_result_trinkets_beginning.json')
  brand_result_trinkets_end: loadFixture('brand_result_trinkets_end.json'),
  brand_result_locksr: loadFixture('brand_result_locksr.json')
}

testWithFixture = (fixture, done) ->
  championgg.sr (err, results) ->
    should.not.exist(err)
    results.should.eql(fixture)
    done()

  , {champs: _.keys(FIXTURES.champions.data)}

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
    describe 'Brand middle and support', ->
      beforeEach ->
        window.cSettings = {}
        nock.cleanAll()
        nocked
          .get('/champion/Brand')
          .reply(200, FIXTURES.brand)
          .get('/champion/Brand/support')
          .reply(200, FIXTURES.brand_support)

      it 'should return default item sets', (done) ->
        testWithFixture(FIXTURES.brand_result_default, done)

      it 'should return split item sets', (done) ->
        window.cSettings = {splititems: true}
        testWithFixture(FIXTURES.brand_result_splititems, done)

      it 'should return with consumables enabled and at the beginning', (done) ->
        window.cSettings = {
          consumables: true
          consumables_position: 'beginning'
        }
        testWithFixture(FIXTURES.brand_result_consumables_beginning, done)

      it 'should return with consumables enabled and at the end', (done) ->
        window.cSettings = {
          consumables: true
          consumables_position: 'end'
        }
        testWithFixture(FIXTURES.brand_result_consumables_end, done)

      it 'should return with trinkets enabled and at the beginning', (done) ->
        window.cSettings = {
          trinkets: true
          trinkets_position: 'beginning'
        }
        testWithFixture(FIXTURES.brand_result_trinkets_beginning, done)

      it 'should return with trinkets enabled and at the end', (done) ->
        window.cSettings = {
          trinkets: true
          trinkets_position: 'end'
        }
        testWithFixture(FIXTURES.brand_result_trinkets_end, done)

      it 'should return with item sets locked to Summoners Rift map', (done) ->
        window.cSettings = {locksr: true}
        testWithFixture(FIXTURES.brand_result_locksr, done)
