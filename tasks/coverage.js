import Promise from 'bluebird';
import aws from 'aws-sdk';
import { execAsync } from './helpers';
import gulp from 'gulp';
import moment from 'moment';
import open from 'open';
import path from 'path';
import R from 'ramda';
import SuperError from 'super-error';

const fs = Promise.promisifyAll(require('fs-extra'));
const request = Promise.promisify(require('request'));

const SkipCoverallsError = SuperError.subclass('SkipCoverallsError');

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = Promise.promisifyAll(new aws.S3({
  params: {Bucket: 'dustinblackman-championify-coverage'}
}));


function _istanbul(report_type) {
  return execAsync(`${path.resolve('./node_modules/.bin/babel-istanbul')} report ${report_type}`);
}

function uploadCoverage() {
  let commit = process.env.APPVEYOR_REPO_COMMIT;
  let filename = 'appveyor.json';
  if (process.env.TRAVIS_COMMIT) {
    commit = process.env.TRAVIS_COMMIT;
    filename = 'travis.json';
  }

  console.log(`Uploading ${commit}/${filename}`);
  return s3.uploadAsync({
    Key: `${commit}/${filename}`,
    Body: fs.readFileSync(path.join(__dirname, '..', 'coverage/coverage.json'))
  });
}

function getCoverage() {
  const commit = process.env.APPVEYOR_REPO_COMMIT || process.env.TRAVIS_COMMIT;
  const coverage_path = path.join(__dirname, '..', 'coverage/coverage-other.json');
  const converted_coverage = {};

  return s3.listObjectsAsync({Prefix: commit})
    .then(data => {
      if (data.Contents.length < 2) throw new Error('Missing second coverage file, skipping');
      return Promise.map(data.Contents, entry => {
        return s3.getObjectAsync({Key: entry.key})
          .then(R.prop('Body'))
          .then(R.toString)
          .then(JSON.parse);
      });
    })
    .each(coverage_json => {
      R.forEach(coverage_data => {
        let file = coverage_data.path.split('src')[1].replace(/\\/g, '/');
        if (file[0] === '/') file = file.substring(1);
        coverage_data.path = path.join(__dirname, '..', 'src', file);
        converted_coverage[coverage_data.path] = coverage_data;
      }, R.values(coverage_json));
    })
    .then(() => fs.writeFileAsync(coverage_path, JSON.stringify(converted_coverage), 'utf8'));
}

function checkIfSubmitted() {
  const commit = process.env.APPVEYOR_REPO_COMMIT || process.env.TRAVIS_COMMIT;
  return request(`https://coveralls.io/builds/${commit}.json`)
    .then(res => {
      if (res.statusCode === 200) throw new SkipCoverallsError('Commit already on Coveralls');
    });
}

// TODO: Stop executing command line, tap in to coveralls source instead.
function runCoveralls() {
  // If Travis
  if (process.env.TRAVIS) {
    const cmd = 'cat ./coverage/lcov.info | ./node_modules/.bin/coveralls';
    return fs.writeFileAsync('./coveralls.sh', cmd, 'utf8')
      .then(() => execAsync('bash ./coveralls.sh'));
  }

  // If Appveyor
  const cmds = [
    '@echo off',
    `SET COVERALLS_RUN_AT=${moment().format('YYYY-MM-DDTHH:mm:ssZ')}`,
    `SET COVERALLS_GIT_BRANCH=${process.env.APPVEYOR_REPO_BRANCH}`,
    `SET COVERALLS_GIT_COMMIT=${process.env.APPVEYOR_REPO_COMMIT}`,
    'type .\\coverage\\lcov.info | .\\node_modules\\.bin\\coveralls'
  ];

  return fs.writeFileAsync('./coveralls.bat', cmds.join('\n'), 'utf8')
   .then(() => execAsync('.\\coveralls.bat'));
}

gulp.task('istanbul-coverage', function() {
  return _istanbul('text-summary');
});

gulp.task('istanbul-instrument', function() {
  return execAsync(`${path.resolve('./node_modules/.bin/babel-istanbul')} instrument -o src-cov src`);
});

gulp.task('istanbul-cleanup', function() {
  return fs.removeAsync('./src-cov');
});

gulp.task('coveralls', function() {
  // TODO: Check if a check is needed to disable during PRs
  return checkIfSubmitted()
    .then(uploadCoverage)
    .then(getCoverage)
    .then(() => _istanbul('lcov text-summary'))
    .then(runCoveralls)
    .catch(err => {
      console.log(err.stack || err);
    });
});

gulp.task('coverage', function(done) {
  open(path.resolve(path.join(__dirname, '../coverage/lcov-report/index.html')));
  return done();
});
