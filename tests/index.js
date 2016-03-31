import fs from 'fs-extra';
import glob from 'glob';
import path from 'path';
import R from 'ramda';
import sinon from 'sinon';


GLOBAL.src_path = process.env.COVERAGE ? 'src-cov' : 'src';
const champions = require('./fixtures/all_champions.json').data;
const T = require(`../${GLOBAL.src_path}/translate`).default;
require(`../${GLOBAL.src_path}/store`);

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

// hook into mocha global after to write coverage reports if found
after(function() {
  if (window.__coverage__) {
    console.log('Found coverage report, writing to coverage/coverage.json');
    const file_path = path.resolve(process.cwd(), 'coverage/coverage.json');
    fs.mkdirsSync(path.dirname(file_path));
    fs.writeFileSync(file_path, JSON.stringify(window.__coverage__));
  }
});
