const T = require(`../${GLOBAL.src_path}/translate`).default;

const should = require('chai').should();

describe('src/translate.coffee', () => {
  before(() => {
    T.loadPhrases('ko');
  });

  after(() => {
    T.loadPhrases('en');
  });

  it('should the set locale', () => {
    T.locale.should.equal('ko');
  });

  it('should merge phrases', () => {
    T.merge({test_phrase: '123'});
    T.t('test_phrase').should.equal('123');
  });

  it('should throw an error when a phrase doesn\'t exist', () => {
    try {
      T.t('blahblah');
    } catch (err) {
      should.exist(err);
    }
  });

  it('should throw an error when a language doesn\'t exist', () => {
    try {
      T.loadPhrases('klingon');
    } catch (err) {
      should.exist(err);
    }
  });
});
