coffeeCoverage = require('coffee-coverage')
coverageVar = coffeeCoverage.findIstanbulVariable()
writeOnExit = if coverageVar == null then true else null

coffeeCoverage.register
  instrumentor: 'istanbul'
  basePath: process.cwd()
  exclude: [
    '/test'
    '/node_modules'
    '/.git'
    '/tasks'
    '/bower_components'
    '/cache'
    '/dev'
    '/releases'
    '/tests'
    '/resources'
    '/helpers'
    'electron.coffee'
  ]
  coverageVar: coverageVar
  writeOnExit: if writeOnExit then (if (_ref = process.env.COFFEECOV_OUT) != null then _ref else 'coverage/coverage-coffee.json') else null
  initAll: if (_ref = process.env.COFFEECOV_INIT_ALL) != null then _ref == 'true' else true
