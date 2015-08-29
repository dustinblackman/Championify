should = require('chai').should()

pkg = require '../package.json'

describe 'electron', ->
  it 'test enviroment should be using the same version in package.json', (done) ->
    process.versions.electron.should.equal(pkg.devDependencies['electron-prebuilt'])
    done()
