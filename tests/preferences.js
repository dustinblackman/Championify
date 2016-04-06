import fs from 'fs-extra';
import path from 'path';

const preferences = require(`../${GLOBAL.src_path}/preferences`).default;

const should = require('chai').should();
const prefs_fixture = {dir: '/123', prefs_version: '1.3.1'};

describe('src/preferences', () => {
  describe('directory', () => {
    it('should the preferences directory depending on the platform', () => {
      let pref_dir;
      if (process.platform === 'darwin') {
        pref_dir = path.join(process.env.HOME, 'Library/Application Support/Championify/');
      } else {
        pref_dir = path.join(process.env.APPDATA, 'Championify');
      }
      preferences.directory().should.equal(pref_dir);
    });
  });

  describe('file', () => {
    it('should the preferences directory depending on the platform', () => {
      let pref_file;
      if (process.platform === 'darwin') {
        pref_file = path.join(process.env.HOME, 'Library/Application Support/Championify/prefs.json');
      } else {
        pref_file = path.join(process.env.APPDATA, 'Championify/prefs.json');
      }
      preferences.file().should.equal(pref_file);
    });
  });

  describe('save', () => {
    it('should save preferences fixture', () => {
      return preferences.save(prefs_fixture)
        .then(() => {
          fs.existsSync(preferences.file()).should.equal(true);
        });
    });
  });

  describe('load', () => {
    it('should load preferences fixture', () => {
      preferences.load().should.eql(prefs_fixture);
    });

    it('should null when no preferences exist', () => {
      fs.removeSync(preferences.file());
      should.not.exist(preferences.load());
    });
  });
});
