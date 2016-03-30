import gulp from 'gulp';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';


gulp.task('run-watch', function(cb) {
  fs.writeFileSync('./dev/dev_enabled', 'dev enabled', 'utf8');

  gulp.watch('./stylesheets/*.styl', ['stylus']);
  gulp.watch('./src/**/*.js', ['babel']);
  if (process.platform === 'win32') gulp.watch('./app/**', ['copy:app']);

  let exec_path = path.resolve('node_modules/.bin/electron');
  if (process.platform === 'win32') exec_path = `${exec_path}.cmd`;
  const current_process = spawn(exec_path, ['.'], {cwd: './dev'});

  current_process.on('close', function(code) {
    console.log(`child process exited with code ${code}`);
    return process.exit(0);
  });
});
