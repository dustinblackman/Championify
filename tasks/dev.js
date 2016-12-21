import gulp from 'gulp';
import fs from 'fs';
import path from 'path';
import open from 'open';
import { spawn } from 'child_process';


function watch() {
  fs.writeFileSync('./dev/dev_enabled', 'dev enabled', 'utf8');

  gulp.watch('./stylesheets/*.styl', ['stylus']);
  if (process.platform === 'win32') {
    gulp.watch('./src/**/*.js', ['babel']);
    gulp.watch('./app/**', ['copy:app']);
  }
}

function pipe(name, spawn_process) {
  spawn_process.stdout.on('data', data => console.log(`${name}: ${data.toString()}`));
  spawn_process.stderr.on('data', data => console.log(`${name}: ${data.toString()}`));
}

gulp.task('run-watch', function(cb) {
  watch();
  let exec_path = path.resolve('node_modules/.bin/electron');
  if (process.platform === 'win32') exec_path = `${exec_path}.cmd`;
  const current_process = spawn(exec_path, ['.'], {cwd: './dev'});
  pipe('electron', current_process);

  current_process.on('close', function(code) {
    console.log(`child process exited with code ${code}`);
    return process.exit(0);
  });
});

gulp.task('run-debug', function(cb) {
  watch();
  let electron_path = path.resolve('node_modules/.bin/electron');
  let inspector_path = path.resolve('node_modules/.bin/electron-inspector');
  if (process.platform === 'win32') {
    electron_path = `${electron_path}.cmd`;
    inspector_path = `${inspector_path}.cmd`;
  }
  const electron_process = spawn(electron_path, ['--debug-brk=5858', '.'], {cwd: './dev'});
  const inspector_process = spawn(inspector_path, []);
  pipe('electron', electron_process);
  pipe('inspector', inspector_process);
  const closed = {};

  electron_process.on('close', function(code) {
    console.log(`electron process exited with code ${code}`);
    closed.electron = true;
    if (!closed.inspector) inspector_process.kill();
    return process.exit(0);
  });

  inspector_process.on('close', function(code) {
    console.log(`inspector process exited with code ${code}`);
    closed.inspector = true;
    if (!closed.electron) electron_process.kill();
    return process.exit(0);
  });

  open('http://127.0.0.1:8080/?port=5858');
});
