/**
 * This file is useful for mocha tests.
 * To use, run mocha --require coffee-coverage/register-istanbul
 */
var coffeeCoverage = require('coffee-coverage');
var coverageVar = coffeeCoverage.findIstanbulVariable();
var writeOnExit = coverageVar == null ? true : null;

var ignore_list = [
  '/.git',
  '/bower_components',
  '/cache',
  '/dev',
  '/helpers',
  '/node_modules',
  '/releases',
  '/resources',
  '/tasks',
  '/test',
  '/tests',
  'electron.coffee',
  'gulpfile.coffee'
];

coffeeCoverage.register({
    instrumentor: 'istanbul',
    basePath: process.cwd(),
    exclude: ignore_list,
    coverageVar: coverageVar,
    writeOnExit: 'coverage/coverage-coffee.json',
    initAll: (_ref = process.env.COFFEECOV_INIT_ALL) != null ? (_ref === 'true') : true
});
