/**
 * This file is useful for mocha tests.
 * To use, run mocha --require coffee-coverage/register-istanbul
 */
var coffeeCoverage = require('coffee-coverage');
var coverageVar = coffeeCoverage.findIstanbulVariable();
var writeOnExit = coverageVar == null ? true : null;

coffeeCoverage.register({
    instrumentor: 'istanbul',
    basePath: process.cwd(),
    exclude: ['/test', '/node_modules', '/.git', '/tasks', '/bower_components', '/cache', '/dev', '/releases', '/tests', '/resources', '/helpers', 'electron.coffee', 'gulpfile.coffee'],
    coverageVar: coverageVar,
    writeOnExit: writeOnExit ? ((_ref = process.env.COFFEECOV_OUT) != null ? _ref : 'coverage/coverage-coffee.json') : null,
    initAll: (_ref = process.env.COFFEECOV_INIT_ALL) != null ? (_ref === 'true') : true
});
