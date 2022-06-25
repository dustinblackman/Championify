import Promise from 'bluebird';
import eslint from 'gulp-eslint';
import gulp from 'gulp';
import htmlhint from 'gulp-htmlhint';
import jsonlint from 'gulp-jsonlint';
import path from 'path';
import runSequence from 'run-sequence';
import {
  spawn
} from 'child_process';
import stylint from 'gulp-stylint';

const fs = Promise.promisifyAll(require('fs-extra'));
const pkg = require('../package.json');


gulp.task('eslint', function() {
  return gulp.src([
    './src/**/*.js',
    './tests/**/*.js',
    './tasks/**/*.js',
    './electron.js'
  ])
    .pipe(eslint(pkg.eslintConfig))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('stylint', function() {
  return gulp.src('stylesheets/**/*.styl')
    .pipe(stylint({
      config: '.stylintrc',
      reporter: {
        reporter: 'stylint-stylish',
        reporterOptions: {
          verbose: true
        }
      }
    }))
    .pipe(stylint.reporter())
    .pipe(stylint.reporter('fail', {
      failOnWarning: true
    }));
});

gulp.task('htmlhint', function() {
  return gulp.src('app/**/*.html')
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.reporter('htmlhint-stylish'))
    .pipe(htmlhint.failReporter({
      suppress: true
    }));
});

gulp.task('jsonlint', function() {
  return gulp.src([
    './data/**/*.json',
    './i18n/**/*.json',
    './tests/**/*.json',
    './.htmlhintrc',
    './.stylintrc',
    './package.json',
    './bower.json'
  ])
    .pipe(jsonlint())
    .pipe(jsonlint.reporter())
    .pipe(jsonlint.failAfterError());
});

gulp.task('lint', function(cb) {
  runSequence(['eslint', 'stylint', 'htmlhint', 'jsonlint'], cb);
});

function mochaWindows(cb) {
  const options = {
    stdio: [process.stdin, process.stdout, process.stderr],
    env: process.env
  };
  options.env.NODE_ENV = 'test';
  options.env.ELECTRON_PATH = `${path.resolve('./node_modules/.bin/electron')}.cmd`;
  options.env.EXITCODE_PATH = path.join(process.cwd(), 'exit.code');
  if (process.env.APPVEYOR) console.log('Note: You can\'t see Mocha test results in AppVeyor due to how Windows spawns processes.');

  const cmd = `${path.resolve('./node_modules/.bin/electron-mocha')}.cmd`;
  const args = ['--compilers', 'js:babel-core/register', '--renderer', '--recursive', '.\\tests\\index.js'];

  const em = spawn(cmd, args, options);
  em.on('close', function(code) {
    if (code !== 0) {
      if (process.env.APPVEYOR) return cb(new Error('Mocha returned an error, and it\'s not displayed here because process spawning on Windows sucks balls. See if the error is happening on Travis-CI, otherwise run tests on a local windows system. https://travis-ci.org/dustinblackman/Championify/builds'));
      return cb(new Error(`Mocha exited with code: ${code}`));
    }
    return cb();
  });
}

function mochaOSX(cb) {
  const options = {
    stdio: [process.stdin, process.stdout, process.stderr], // TODO: Why?
    env: process.env
  };
  options.env.NODE_ENV = 'test';
  options.env.ELECTRON_PATH = path.resolve('./node_modules/.bin/electron');

  const electron_mocha = path.resolve('./node_modules/.bin/electron-mocha');
  const args = ['--compilers', 'js:babel-core/register', '--renderer', '--recursive', './tests/index.js'];
  const em = spawn(electron_mocha, args, options);
  em.on('close', function(code) {
    if (code !== 0) return cb(new Error(`Mocha exited with code: ${code}`));
    return cb();
  });
}

gulp.task('mocha', function(cb) {
  const tmp_dir = path.join(__dirname, '..', 'tmp');
  if (fs.existsSync(tmp_dir)) fs.removeSync(tmp_dir);
  if (process.platform === 'win32') {
    mochaWindows(cb);
  } else {
    mochaOSX(cb);
  }
});

gulp.task('test', function(cb) {
  runSequence('lint', 'mocha', cb);
});

gulp.task('test-coverage', function(cb) {
  process.env.COVERAGE = 1;
  runSequence(['lint', 'istanbul-instrument'], 'mocha', ['istanbul-cleanup', 'istanbul-coverage'], cb);
});
