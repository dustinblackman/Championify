require('../_init')

fs = require 'fs'
glob = require 'glob'
nock = require 'nock'
path = require 'path'
should = require('chai').should()
_ = require('lodash')

championgg = require '../../lib/sources/championgg'
nocked = null

RESPONSES_FIXTURES = {
  champions: JSON.parse fs.readFileSync(path.join(__dirname, 'fixtures/championgg/responses/champions.json'))
}
_.each glob.sync(path.join(__dirname, 'fixtures/championgg/responses/*.html')), (fixture) ->
  var_name = path.basename(fixture).replace('.html', '')
  RESPONSES_FIXTURES[var_name] = fs.readFileSync(fixture)

RESULTS_FIXTURES = {}
_.each glob.sync(path.join(__dirname, 'fixtures/championgg/results/*.json')), (fixture) ->
  var_name = path.basename(fixture).replace('.json', '')
  RESULTS_FIXTURES[var_name] = require(fixture)

testWithFixture = (fixture, done) ->
  championgg.sr (err, results) ->
    should.not.exist(err)
    results.should.eql(fixture)
    done()

  , {champs: _.keys(RESPONSES_FIXTURES.champions.data)}

describe 'lib/sources/championgg.coffee', ->
  before ->
    nocked = nock('http://champion.gg')

  afterEach ->
    nock.cleanAll()

  describe 'version', ->
    it 'should get the stubbed championgg version', (done) ->
      nocked
        .get('/faq/')
        .reply(200, RESPONSES_FIXTURES.faq)

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
          .reply(200, RESPONSES_FIXTURES.brand)
          .get('/champion/Brand/support')
          .reply(200, RESPONSES_FIXTURES.brand_support)

      it 'should return default item sets', (done) ->
        testWithFixture(RESULTS_FIXTURES.brand_result_default, done)

      it 'should return split item sets', (done) ->
        window.cSettings = {splititems: true}
        testWithFixture(RESULTS_FIXTURES.brand_result_splititems, done)

      it 'should return with item sets locked to Summoners Rift map', (done) ->
        window.cSettings = {locksr: true}
        testWithFixture(RESULTS_FIXTURES.brand_result_locksr, done)

      it 'should return with consumables enabled and at the beginning', (done) ->
        window.cSettings = {
          consumables: true
          consumables_position: 'beginning'
        }
        testWithFixture(RESULTS_FIXTURES.brand_result_consumables_beginning, done)

      it 'should return with consumables enabled and at the end', (done) ->
        window.cSettings = {
          consumables: true
          consumables_position: 'end'
        }
        testWithFixture(RESULTS_FIXTURES.brand_result_consumables_end, done)

      it 'should return with trinkets enabled and at the beginning', (done) ->
        window.cSettings = {
          trinkets: true
          trinkets_position: 'beginning'
        }
        testWithFixture(RESULTS_FIXTURES.brand_result_trinkets_beginning, done)

      it 'should return with trinkets enabled and at the end', (done) ->
        window.cSettings = {
          trinkets: true
          trinkets_position: 'end'
        }
        testWithFixture(RESULTS_FIXTURES.brand_result_trinkets_end, done)


      it 'should return with consumables enabled and split item sets', (done) ->
        window.cSettings = {
          splititems: true
          consumables: true
          consumables_position: 'beginning'
        }
        testWithFixture(RESULTS_FIXTURES.brand_result_splititems_consumables, done)


      it 'should return with trinkets enabled and split item sets', (done) ->
        window.cSettings = {
          splititems: true
          trinkets: true
          trinkets_position: 'beginning'
        }
        testWithFixture(RESULTS_FIXTURES.brand_result_splititems_trinkets, done)
