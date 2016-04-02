import Promise from 'bluebird';
import cheerio from 'cheerio';
import glob from 'glob';
import gulp from 'gulp';
import request from 'request';
import runSequence from 'run-sequence';
import path from 'path';

const fs = Promise.promisifyAll(require('fs-extra'));


gulp.task('build-artifact:osx', function() {
  return runSequence('package-asar', 'compile:osx', 'zip:osx', 'upload-artifact');
});

gulp.task('build-artifact:win', function() {
  return runSequence('package-asar', 'compile:win', 'zip:win', 'upload-artifact');
});

gulp.task('build-artifact', function(done) {
  if (process.platform === 'win32') return runSequence('build-artifact:win', done);
  return runSequence('build-artifact:osx', done);
});

gulp.task('upload-artifact', function() {
  const commit = process.env.APPVEYOR_REPO_COMMIT || process.env.TRAVIS_COMMIT || 'NO_COMMIT';
  const file = glob.sync('./releases/*.zip')[0];
  const file_name = `Championify-${process.platform }-${commit}.zip`;
  const upload_file = path.join('./releases', file_name);

  const request_options = {
    method: 'POST',
    url: 'http://www92.zippyshare.com/upload',
    headers: {
      Referer: 'http://www.zippyshare.com/sites/index_old.jsp'
    }
  };

  return fs.moveAsync(file, upload_file)
    .then(() => {
      return new Promise(resolve => {
        console.log('Uploading file...');
        const req = request(request_options, function(err, res, body) {
          if (err) console.log(err);
          const $c = cheerio.load(body);
          const download_url = $c('.text_field').val();
          console.log(`Download build based off commit: ${download_url}`);
          return resolve(download_url);
        });

        const form = req.form();
        form.append('file', fs.createReadStream(upload_file));
      });
    })
    .then(download_url => fs.writeFileAsync('./download.txt', download_url, 'utf8'));
});
