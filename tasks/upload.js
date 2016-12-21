import Promise from 'bluebird';
import GitHubAPI from 'github';
import glob from 'glob';
import gulp from 'gulp';
import path from 'path';
import R from 'ramda';

const fs = Promise.promisifyAll(require('fs-extra'));
const request = Promise.promisify(require('request'));
const pkg = require('../package.json');

global.vtReports = {};

gulp.task('virustotal', function() {
  return request({url: `https://www.virustotal.com/vtapi/v2/file/scan/upload_url?apikey=${process.env.VIRUSTOTAL}`, json: true})
    .then(R.path(['body', 'upload_url']))
    .then(upload_url => {
      return Promise.resolve(glob.sync('./releases/*'))
        .each(file_path => {
          if (file_path.indexOf('RELEASE') > -1) return;
          console.log('[VIRUSTOTAL] Uploading: ' + file_path);
          const options = {
            method: 'POST',
            formData: {file: fs.createReadStream(file_path)},
            url: upload_url
          };

          return request(options)
            .then(R.prop('body'))
            .then(JSON.parse)
            .then(R.prop('permalink'))
            .then(permalink => global.vtReports[path.basename(file_path)] = permalink);
        });
    })
    .tap(() => console.log(global.vtReports));
});

gulp.task('github-release', function(cb) {
  const github = new GitHubAPI({
    version: '3.0.0',
    protocol: 'https',
    timeout: 5000,
    headers: {'user-agent': 'Championify-Gulp-Release'}
  });

  github.authenticate({type: 'oauth', token: process.env.GITHUB_TOKEN});
  const createRelease = Promise.promisify(github.releases.createRelease);
  const uploadAsset = Promise.promisify(github.releases.uploadAsset);

  const changelog = fs.readFileSync('./CHANGELOG.md', 'utf8');
  const download_path = `https://github.com/dustinblackman/Championify/releases/download/${pkg.version}`;
  let body = `## Quick Downloads

Windows: [Setup.exe](${download_path}/Championify-Windows_Setup-${pkg.version}.exe) | [ZIP](${download_path}/Championif-WIN-${pkg.version}.zip)
macOS: [DMG](${download_path}/Championify-OSX-${pkg.version}.dmg) | [ZIP](${download_path}/Championify-OSX-${pkg.version}.zip)`;
  body += `\n\n## Changelog ${changelog.split(/<a name="*.*.*" \/>/g)[1]}`;
  body += '\n\n## Virus Total Reports\n';

  function formatTitle(name, link) {
    return `- [${name}](${link})\n`;
  }

  R.forEach(item => {
    if (item.indexOf('Windows_Setup') > -1) body += formatTitle('Windows Setup', global.vtReports[item]);
    if (item.indexOf('-WIN-') > -1) body += formatTitle('Windows ZIP', global.vtReports[item]);
    if (item.indexOf('OSX') > -1 && item.indexOf('dmg') > -1) body += formatTitle('Mac/OSX DMG', global.vtReports[item]);
    if (item.indexOf('OSX') > -1 && item.indexOf('zip') > -1) body += formatTitle('Mac/OSX ZIP', global.vtReports[item]);
    if (item.indexOf('nupkg') > -1) body += formatTitle('nupkg', global.vtReports[item]);
  }, R.keys(global.vtReports));

  const create_release = {
    owner: 'dustinblackman',
    repo: 'Championify',
    tag_name: pkg.version,
    draft: true,
    name: `Championify ${pkg.version}`,
    body
  };

  return createRelease(create_release)
    .then(R.prop('id'))
    .then(id => {
      return Promise.resolve(glob.sync('./releases/*'))
        .each(file_path => {
          console.log(`[GITHUB] Uploading: ${file_path}`);
          const upload_file = {
            owner: 'dustinblackman',
            repo: 'Championify',
            id,
            name: path.basename(file_path),
            filePath: file_path
          };
          return uploadAsset(upload_file);
        });
    });
});
