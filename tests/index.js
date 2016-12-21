import fs from 'fs-extra';
import glob from 'glob';
import path from 'path';
import R from 'ramda';
import sinon from 'sinon';


global.src_path = process.env.COVERAGE ? 'src-cov' : 'src';
const champions = require('./fixtures/all_champions.json').data;
const T = require(`../${global.src_path}/translate`).default;
require(`../${global.src_path}/store`);

window.$ = sinon.stub();
window.$.withArgs('#cl_progress').returns({prepend: function() {}});

// Import champion translations so it can be used in all tests
let translations = R.zipObj(R.keys(champions), R.pluck('name')(R.values(champions)));
translations = R.zipObj(R.map(key => key.toLowerCase().replace(/ /g, ''), R.keys(translations)), R.values(translations));
translations.wukong = translations.monkeyking;
T.merge(translations);

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
