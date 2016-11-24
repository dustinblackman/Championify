import fs from 'fs';
import glob from 'glob';
import path from 'path';
import R from 'ramda';

const should = require('chai').should();
const _source = JSON.parse(fs.readFileSync(path.join(__dirname, '../i18n/_source.json')));

const keys_count = R.keys(_source).length;
const locales = {};

function isPR() {
  if (process.env.TRAVIS_PULL_REQUEST && process.env.TRAVIS_PULL_REQUEST !== 'false') return true;
  if (process.env.APPVEYOR_PULL_REQUEST_NUMBER) return true;
  return false;
}

if (!isPR()) {
  describe('i18n', () => {
    before(() => {
      const locales_files = glob.sync('./i18n/*.json');
      locales_files.shift();
      R.forEach(locale_path => {
        const locale = path.basename(locale_path).replace('.json', '');
        locales[locale] = JSON.parse(fs.readFileSync(path.join(__dirname, '..', locale_path)));
      }, locales_files);
    });

    describe('each locale', () => {
      it('should have the same length of keys as _source', () => {
        R.forEach(locale => {
          R.keys(locales[locale]).length.should.equal(keys_count);
        }, R.keys(locales));
      });
      it('should contain the same keys as _source', () => {
        R.forEach(key => {
          R.forEach(locale => {
            should.exist(locales[locale][key]);
          }, R.keys(locales));
        }, R.keys(_source));
      });
    });
  });
}

