const hlp = require(`../${global.src_path}/helpers`);

describe('src/helpers', function() {
  describe('spliceVersion', function() {
    it('should return a two digit version number', function() {
      hlp.spliceVersion('1.2.3').should.equal('1.2');
    });
  });
});
