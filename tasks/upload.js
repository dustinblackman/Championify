import Promise from 'bluebird';
import GitHubAPI from 'github';
import glob from 'glob';
import gulp from 'gulp';
import path from 'path';
import R from 'ramda';

const fs = Promise.promisifyAll(require('fs-extra'));
const request = Promise.promisify(require('request'));
const pkg = require('../package.json');

GLOBAL.vtReports = {};

gulp.task('virustotal', function() {
  return request({url: `https://www.virustotal.com/vtapi/v2/file/scan/upload_url?apikey=${process.env.VIRUSTOTAL}`, json: true})
    .then(R.path(['body', 'upload_url']))
    .then(upload_url => {
      return Promise.resolve(glob.sync('./releases/*'))
        .each(file_path => {
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
            .then(permalink => GLOBAL.vtReports[path.basename(file_path)] = permalink);
        });
    })
    .tap(() => console.log(GLOBAL.vtReports));
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
  let body = changelog.split(/<a name="*.*.*" \/>/g)[1];
  body += '\n\n## Virus Total Reports\n';

  function formatTitle(name, link) {
    return `[${name} | VirusTotal Report](${link})\n`;
  }

  R.forEach(item => {
    if (item.indexOf('Windows_Setup') > -1) body += formatTitle('Windows Setup', GLOBAL.vtReports[item]);
    if (item.indexOf('.WIN.') > -1) body += formatTitle('Windows ZIP', GLOBAL.vtReports[item]);
    if (item.indexOf('OSX') > -1) body += formatTitle('Mac/OSX', GLOBAL.vtReports[item]);
    if (item.indexOf('asar') > -1) body += formatTitle('update.asar', GLOBAL.vtReports[item]);
    if (item.indexOf('u_osx') > -1) body += formatTitle('u_osx.tar.gz', GLOBAL.vtReports[item]);
    if (item.indexOf('u_win') > -1) body += formatTitle('u_win.tar.gz', GLOBAL.vtReports[item]);
  }, R.keys(GLOBAL.vtReports));

  body += [
    '',
    '## How to Download:',
    'Below you\'ll find the download section. If you\'re on Windows, your best bet it to select the "Windows Setup" to get yourself started with Championify. If you have trouble installing you can always try the ".zip" version.',
    'For Mac, download the file labeled "OSX", extract the .zip, and you\'ll be good to go!'
  ].join('\n');

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
