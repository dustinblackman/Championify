import fs from 'fs';
import glob from 'glob';
import nock from 'nock';
import path from 'path';
import R from 'ramda';

const lolalytics = require(`../../${GLOBAL.src_path}/sources/lolalytics`);
const store = require(`../../${GLOBAL.src_path}/store`).default;

let nocked = null;

const champions = R.keys(require(path.join(__dirname, 'fixtures/championgg/responses/champions.json')).data).sort();

const RESPONSES_FIXTURES = {};
R.forEach(fixture => {
  RESPONSES_FIXTURES[path.basename(fixture).replace('.html', '')] = fs.readFileSync(fixture, 'utf8');
}, glob.sync(path.join(__dirname, 'fixtures/lolalytics/responses/*.html')));

const RESULTS_FIXTURES = {};
R.forEach(fixture => {
  RESULTS_FIXTURES[path.basename(fixture).replace('.json', '')] = require(fixture);
}, glob.sync(path.join(__dirname, 'fixtures/lolalytics/results/*.json')));


describe('src/sources/lolalytics', () => {
  before(() => {
    nocked = nock('http://current.lolalytics.com');
    store.set('champs', champions);
  });

  beforeEach(() => {
    store.remove('sr_itemsets');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('version', () => {
    it('should get the stubbed lolalytics version', () => {
      nocked.get('/').reply(200, RESPONSES_FIXTURES.current_lolalytics);
      return lolalytics.getVersion().then(version => {
        version.should.equal('6.23');
      });
    });
  });
});
