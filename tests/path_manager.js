import fs from 'fs-extra';
import path from 'path';

const pathManager = require(`../${global.src_path}/path_manager`).default;

const should = require('chai').should();
const osxDescribe = (process.platform === 'darwin' ? describe : describe.skip);
const winDescribe = (process.platform === 'win32' ? describe : describe.skip);

describe('src/path_manager', () => {
  osxDescribe('osx: checkInstallPath', () => {
    it('should an error when an invalid path is given', function(done) {
      var test_path;
      test_path = path.resolve('./');
      pathManager.checkInstallPath(test_path, function(err, selected_path) {
        should.exist(err);
        err.message.should.equal('Path not found');
        selected_path.should.equal(test_path);
        done();
      });
    });

    it('should the correct path when League Of Legends.app is selected', function(done) {
      fs.mkdirsSync('./tmp/League Of Legends.app/Contents/Lol');
      const test_path = path.resolve('./tmp/League Of Legends.app');
      pathManager.checkInstallPath(test_path, function(err, selected_path, config_dir) {
        should.not.exist(err);
        selected_path.should.equal(test_path);
        config_dir.should.equal('Contents/LoL/Config/Champions/');
        done();
      });
    });

    it('should the correct path when the Applications directory is selected', function(done) {
      fs.mkdirsSync('./tmp/League Of Legends.app/Contents/Lol');
      const test_path = path.resolve('./tmp');
      pathManager.checkInstallPath(test_path, function(err, selected_path, config_dir) {
        should.not.exist(err);
        selected_path.should.equal(path.join(test_path, 'League of Legends.app'));
        config_dir.should.equal('Contents/LoL/Config/Champions/');
        done();
      });
    });
  });

  winDescribe('win: checkInstallPath', () => {
    it('should an error when an invalid path is given', function(done) {
      const test_path = path.resolve('./');
      pathManager.checkInstallPath(test_path, function(err, selected_path, config) {
        should.exist(err);
        err.message.should.equal('Path not found');
        selected_path.should.equal(test_path);
        done();
      });
    });

    it('should the correct path for a default League installation - New Launcher', function(done) {
      fs.mkdirsSync('./tmp/0/');
      fs.writeFileSync('./tmp/0/LeagueClient.exe', '123', 'utf8');
      const test_path = path.resolve('./tmp/0/');
      pathManager.checkInstallPath(test_path, function(err, selected_path, config_dir, executable) {
        should.not.exist(err);
        selected_path.should.equal(test_path);
        config_dir.should.equal('Config/Champions/');
        executable.should.equal('LeagueClient.exe');
        done();
      });
    });

    it('should the correct path for a default League installation - Old Launcher', function(done) {
      fs.mkdirsSync('./tmp/1/');
      fs.writeFileSync('./tmp/1/lol.launcher.exe', '123', 'utf8');
      const test_path = path.resolve('./tmp/1/');
      pathManager.checkInstallPath(test_path, function(err, selected_path, config_dir, executable) {
        should.not.exist(err);
        selected_path.should.equal(test_path);
        config_dir.should.equal('Config/Champions/');
        executable.should.equal('lol.launcher.exe');
        done();
      });
    });

    it('should the correct path for garena check 1 installation', function(done) {
      fs.mkdirsSync('./tmp/2/');
      fs.writeFileSync('./tmp/2/lolex.exe', '123', 'utf8');
      const test_path = path.resolve('./tmp/2/');
      pathManager.checkInstallPath(test_path, function(err, selected_path, config_dir, executable) {
        should.not.exist(err);
        selected_path.should.equal(test_path);
        config_dir.should.equal('Game/Config/Champions/');
        executable.should.equal('lolex.exe');
        done();
      });
    });

    it('should the correct path for garena check 2 installation', function(done) {
      fs.mkdirsSync('./tmp/3/GameData/Apps/LoLTH');
      fs.writeFileSync('./tmp/3/LoLTHLauncher.exe', '123', 'utf8');
      const test_path = path.resolve('./tmp/3');
      pathManager.checkInstallPath(test_path, function(err, selected_path, config_dir, executable) {
        should.not.exist(err);
        selected_path.should.equal(test_path);
        config_dir.should.equal('GameData/Apps/LoLTH/Game/Config/Champions/');
        executable.should.equal('LoLTHLauncher.exe');
        done();
      });
    });
  });
});
