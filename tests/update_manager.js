import fs from 'fs-extra';
import nock from 'nock';

const updateManager = require(`../${global.src_path}/update_manager`).default;

require('chai').should();
const pkg = JSON.parse(fs.readFileSync('./package.json'));
let nocked = null;

describe('src/update_manager.coffee', () => {
  before(() => {
    nocked = nock('https://raw.githubusercontent.com');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('check', () => {
    it('should say no update is required', () => {
      nocked.get('/dustinblackman/Championify/master/package.json').reply(200, pkg);
      return updateManager.check().spread((version, major) => {
        version.should.equal(false);
        major.should.equal(false);
      });
    });

    it('should say a minor update is required', () => {
      pkg.version = '100.0.0';
      nocked.get('/dustinblackman/Championify/master/package.json').reply(200, pkg);
      return updateManager.check().spread((version, major) => {
        version.should.equal(pkg.version);
        major.should.equal(false);
      });
    });

    it('should say a major update is required', () => {
      pkg.devDependencies['electron'] = '100.0.0';
      nocked.get('/dustinblackman/Championify/master/package.json').reply(200, pkg);
      nocked.get('/dustinblackman/Championify/master/package.json').reply(200, pkg);
      return updateManager.check().spread((version, major) => {
        version.should.equal(pkg.version);
        major.should.equal(true);
      });
    });
  });
});
