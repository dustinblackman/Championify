const optionsParser = require(`../${global.src_path}/options_parser`).default;

require('chai').should();

describe('src/options_parser', () => {
  describe('import', () => {
    it('should false', () => {
      optionsParser['import']().should.equal(false);
    });
  });
  describe('delete', () => {
    it('should false', () => {
      optionsParser['delete']().should.equal(false);
    });
  });
  describe('close', () => {
    it('should false', () => {
      optionsParser.close().should.equal(false);
    });
  });
  describe('autorun', () => {
    it('should false', () => {
      optionsParser.autorun().should.equal(false);
    });
  });
  describe('runnedAsAdmin', () => {
    it('should false', () => {
      optionsParser.runnedAsAdmin().should.equal(false);
    });
  });
  describe('startLeague', () => {
    it('should false', () => {
      optionsParser.startLeague().should.equal(false);
    });
  });
});
