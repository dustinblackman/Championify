import glob from 'glob';
import R from 'ramda';
import sinon from 'sinon';

import T from '../src/translate';
import '../src/store';
const champions = require('./fixtures/all_champions.json').data;


window.$ = sinon.stub();
window.$.withArgs('#cl_progress').returns({prepend: function() {}});

T.merge(R.zipObj(R.keys(champions), R.pluck('name')(R.values(champions))));

const glob_options = {
  realpath: true,
  nodir: true
};

const test_files = R.flatten([
  glob.sync('./tests/*/*.js', glob_options),
  glob.sync('./tests/*(!(index.js)).js', glob_options)
]);

R.forEach(test_case => require(test_case), test_files);
