import Promise from 'bluebird';
import aws from 'aws-sdk';
import { exec } from 'child_process';
import gulp from 'gulp';
import moment from 'moment';
import open from 'open';
import path from 'path';
import R from 'ramda';
import SuperError from 'super-error';

const fs = Promise.promisifyAll(require('fs-extra'));
const request = Promise.promisify(require('request'));
const travis = require(path.join(__dirname, 'helpers/travis.js'));

const SkipCoverallsError = SuperError.subclass('SkipCoverallsError');


function _exec(cmd) {
  return new Promise((resolve, reject) => {
    return exec(cmd, function(err, stdout, stderr) {
      if (stdout) console.log(stdout);
      if (stderr) console.log(stderr);

      if (err) return reject(err);
      resolve();
    });
  });
}

function _istanbul(report_type) {
  return _exec(`${path.resolve('./node_modules/.bin/babel-istanbul')} report ${report_type}`);
}

function fromTravis() {
  aws.config.update({
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_TOKEN
  });
  let s3 = new aws.S3({
    params: {Bucket: 'dustinblackman-travis-artifacts'}
  });
  s3 = Promise.promisifyAll(s3);

  return s3.listObjectsAsync({Prefix: `dustinblackman/Championify/${process.env.APPVEYOR_BUILD_NUMBER}`})
    .then(data => {
      let coverage_key;
      R.forEach(obj => {
        if (!coverage_key && obj.Key.indexOf('coverage.json') > -1) coverage_key = obj.Key;
      }, data.Contents);
      if (!coverage_key) throw new Error('Travis not ready, coverage file not found on S3.');

      return s3.getObjectAsync({Key: coverage_key})
        .then(R.prop('Body'))
        .then(R.toString)
        .then(JSON.parse);
    });
}

function fromAppveyor() {
  const build_number = `${process.env.TRAVIS_BRANCH}-${process.env.TRAVIS_BUILD_NUMBER}`;
  const headers = {
    Authorization: `Bearer ${process.env.APPVEYOR_KEY}`,
    'Content-type': 'application/json'
  };
  const options = {
    url: `https://ci.appveyor.com/api/projects/dustinblackman/Championify/build/${build_number}`,
    json: true,
    headers
  };

  return request(options)
    .then(R.prop('body'))
    .then(build_data => {
      if (!build_data.build || build_data.build.jobs) throw new Error('Appveyor not ready, job not found.');
      const job_data = R.find(R.propEq('name', 'Platform: x86'))(build_data.build.jobs);
      if (!job_data || job_data.status !== 'success') return;

      const options = {
        url: `https://ci.appveyor.com/api/buildjobs/${job_data.jobId}/artifacts/coverage/coverage.json`,
        json: true,
        headers
      };
      return request(options).then(R.prop('body'));
    });
}

function onCoveralls() {
  const commit = process.env.APPVEYOR_REPO_COMMIT || process.env.TRAVIS_COMMIT;
  return request(`https://coveralls.io/builds/${commit}.json`)
    .then(res => {
      if (res.statusCode === 200) throw new SkipCoverallsError('Commit already on Coveralls');
    });
}

function coverageDownload() {
  let getCoverage;
  if (process.env.APPVEYOR) {
    getCoverage = fromTravis;
  } else if (process.env.TRAVIS) {
    getCoverage = fromAppveyor;
  } else {
    throw new SkipCoverallsError('Not on CI');
  }

  return getCoverage()
    .then(coverage_json => {
      if (!coverage_json) throw new SkipCoverallsError('Other CI is not ready yet, skipping...');

      const converted_coverage = {};
      R.forEach(coverage_data => {
        let file = coverage_data.path.split('src')[1].replace(/\\/g, '/');
        if (file[0] === '/') file = file.substring(1);
        coverage_data.path = path.join(__dirname, '..', 'src', file);
        converted_coverage[coverage_data.path] = coverage_data;
      }, R.values(coverage_json));

      const coverage_path = path.join(__dirname, '..', 'coverage/coverage-other.json');
      return fs.writeFileAsync(coverage_path, JSON.stringify(converted_coverage), 'utf8');
    });
}

function coverallsSetup() {
  // If Travis
  if (process.env.TRAVIS) {
    const cmd = 'cat ./coverage/lcov.info | ./node_modules/.bin/coveralls';
    return fs.writeFileAsync('./coveralls.sh', cmd, 'utf8')
      .then(() => _exec('bash ./coveralls.sh'));
  }

  // If Appveyor
  const params = {
    url: 'https://api.travis-ci.org/repos/dustinblackman/Championify/builds',
    method: 'GET'
  };

  return travis(params)
    .then(body => {
      const build_number = process.env.APPVEYOR_BUILD_NUMBER.toString();
      const build = R.find(R.propEq('number', build_number))(body.builds);
      if (!build) throw new Error(`Could not find travis build number: ${build_number}`);

      const cmds = [
        '@echo off',
        `SET COVERALLS_RUN_AT=${moment().format('YYYY-MM-DDTHH:mm:ssZ')}`,
        `SET COVERALLS_SERVICE_JOB_ID=${build.job_ids[0]}`,
        `SET COVERALLS_GIT_BRANCH=${process.env.APPVEYOR_REPO_BRANCH}`,
        `SET COVERALLS_GIT_COMMIT=${process.env.APPVEYOR_REPO_COMMIT}`,
        'type .\\coverage\\lcov.info | .\\node_modules\\.bin\\coveralls'
      ];
      return fs.writeFileAsync('./coveralls.bat', cmds.join('\n'), 'utf8');
    })
    .then(() => _exec('.\\coveralls.bat'));
}

gulp.task('istanbul-coverage', function() {
  return _istanbul('text-summary');
});

gulp.task('istanbul-instrument', function() {
  return _exec(`${path.resolve('./node_modules/.bin/babel-istanbul')} instrument -o src-cov src`);
});

gulp.task('istanbul-cleanup', function() {
  return fs.removeAsync('./src-cov');
});

gulp.task('coveralls', function() {
  if ((process.env.APPVEYOR && !process.env.AWS_KEY) || (process.env.TRAVIS && !process.env.APPVEYOR_KEY)) {
    console.log('Coveralls is disabled for pull requests');
    return Promise.resolve();
  }

  return onCoveralls()
    .then(coverageDownload)
    .then(() => _istanbul('lcov text-summary'))
    .then(coverallsSetup)
    .catch(err => {
      console.log(err.stack || err);
    });
});

gulp.task('coverage', function(done) {
  open(path.resolve(path.join(__dirname, '../coverage/lcov-report/index.html')));
  return done();
});
