import Promise from 'bluebird';
import clean from 'gulp-clean';
import del from 'del';
import glob from 'glob';
import gulp from 'gulp';
import path from 'path';
import runSequence from 'run-sequence';

const fs = Promise.promisifyAll(require('fs-extra'));
const pkg = require('../package.json');


gulp.task('mkdir:app', function() {
  return Promise.resolve(glob.sync('./app/**/'))
    .each(file => fs.mkdirsAsync(file));
});

gulp.task('copy:app', function() {
  return Promise.resolve(glob.sync('./app/**', {nodir: true}))
    .each(file => {
      const newfile = file.replace('./app', './dev');
      return fs.copyAsync(file, newfile);
    });
});

gulp.task('copy:data', function() {
  return fs.copyAsync('./data/', './dev/data');
});

gulp.task('symlink:app', function() {
  return Promise.resolve(glob.sync('./app/**', {nodir: true}))
    .each(old_path => {
      const new_path = old_path.replace('./app', './dev');
      old_path = old_path.replace('./app/', `${process.cwd()}/app/`);
      fs.mkdirsSync(path.dirname(new_path));
      return fs.symlinkAsync(old_path, new_path);
    });
});

gulp.task('copy:views', function() {
  fs.mkdirsSync('./dev/views');
  return fs.copyAsync('./views/', './dev/views');
});

gulp.task('symlink:views', function() {
  fs.mkdirsSync('./dev/views');
  Promise.resolve(glob.sync('./views/**', {nodir: true}))
    .each(old_path => {
      const new_path = old_path.replace('./views', './dev/views');
      old_path = old_path.replace('./views/', `${process.cwd()}/views/`);
      return fs.symlinkAsync(old_path, new_path);
    });
});

gulp.task('copy:translations', function(cb) {
  fs.mkdirsSync('./dev/i18n');
  return fs.copyAsync('./i18n/', './dev/i18n')
    .then(() => fs.removeAsync('./dev/i18n/_source.json'));
});

gulp.task('symlink:translations', function(cb) {
  fs.mkdirsSync('./dev/i18n');
  return Promise.resolve(glob.sync('./i18n/*.json', {nodir: true}))
    .each(old_path => {
      if (old_path.indexOf('_source.json') > -1) return Promise.resolve();
      const new_path = old_path.replace('./i18n', './dev/i18n');
      old_path = old_path.replace('./i18n/', `${process.cwd()}/i18n/`);
      return fs.symlinkAsync(old_path, new_path);
    });
});

gulp.task('dev_folder', function(cb) {
  if (process.platform === 'win32') return runSequence(['copy:app', 'copy:views', 'copy:translations'], cb);
  return runSequence(['symlink:app', 'symlink:views', 'symlink:translations'], cb);
});

gulp.task('delete-dev', function() {
  return gulp.src(['./dev', './tmp'])
    .pipe(clean({force: true}));
});

gulp.task('delete-releases', function() {
  return gulp.src(['./releases'])
    .pipe(clean({force: true}));
});

gulp.task('create-releases-folder', function() {
  return fs.mkdirsAsync('./releases');
});

gulp.task('move:asar:update', function() {
  return fs.copyAsync('./tmp/app.asar', './releases/update.asar');
});

gulp.task('move:compiled-win:folder', function(cb) {
  return fs.moveAsync(path.join('./tmp', pkg.name), path.join('./releases', pkg.name), {clobber: true});
});

gulp.task('move:compiled-mac:folder', function(cb) {
  return fs.moveAsync(path.join('./tmp', pkg.name + '.app'), path.join('./releases', pkg.name + '.app'), {clobber: true});
});

gulp.task('clean:node_modules', function() {
  return del([
    './dev/node_modules/**/*.md',
    './dev/node_modules/**/*.txt',
    './dev/node_modules/**/*.zip',
    './dev/node_modules/**/Makefile',
    './dev/node_modules/**/.travis.yml',
    './dev/node_modules/**/README*',
    './dev/node_modules/**/LICENSE*',

    './dev/node_modules/**/doc',
    './dev/node_modules/**/example',
    './dev/node_modules/**/examples',
    './dev/node_modules/**/man',
    './dev/node_modules/**/test',
    './dev/node_modules/**/tests',
    './dev/node_modules/**/tst',

    './dev/node_modules/jquery/src/**',
    './dev/node_modules/jquery/sizzle/**',
    './dev/node_modules/jquery/dist/jquery.js',
    './dev/node_modules/jquery/dist/jquery.slim.js',
    './dev/node_modules/jquery/dist/jquery.slim.min.js',
    './dev/node_modules/jquery/dist/jquery.slim.min.map',

    './dev/node_modules/**/async/dist',
    './dev/node_modules/hawk/dist',
    './dev/node_modules/qs/dist',

    './dev/node_modules/**/minimatch/browser.js',

    './dev/node_modules/jade/bin',
    './dev/node_modules/semver/bin',
    './dev/node_modules/runas/src',

    './dev/node_modules/source-map/build',

    './dev/node_modules/semantic-ui-css/components/**',
    './dev/node_modules/semantic-ui-css/semantic.css',
    './dev/node_modules/semantic-ui-css/semantic.js',

    './dev/node_modules/bluebird/js/browser/**',
    './dev/node_modules/bluebird-retry/browser/**',
    './dev/node_modules/har-validator/node_modules/bluebird/js/browser/**',

    './dev/node_modules/escodegen/node_modules/esprima/test/**',

    './dev/node_modules/ramda/src/**',
    './dev/node_modules/ramda/dist/ramda.min.js',

    './dev/node_modules/uglify-js/node_modules/source-map/dist/**',

    './dev/node_modules/transformer/node_modules/.bin',
    './dev/node_modules/transformer/node_modules/source-map/build',
    './dev/node_modules/transformer/node_modules/source-map/test',
    './dev/node_modules/transformer/node_modules/uglify-js/bin',
    './dev/node_modules/transformer/node_modules/uglify-js/test',

    './dev/node_modules/with/node_modules/acorn/src/**'
  ]);
});
