const hlp = require('../src-cov/helpers');

describe('src/helpers.coffee', function() {
  describe('wins', function() {
    it('should return win precentage', function() {
      hlp.wins(1).should.equal('1%');
    });
  });

  describe('spliceVersion', function() {
    it('should return a two digit version number', function() {
      hlp.spliceVersion('1.2.3').should.equal('1.2');
    });
  });
});
