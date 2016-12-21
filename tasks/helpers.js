import Promise from 'bluebird';
import { exec, spawn } from 'child_process';

export function spawnAsync(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    proc.stdout.on('data', data => console.log(data.toString()));
    proc.stderr.on('data', data => console.log(data.toString()));
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}}`));
      resolve();
    });
  });
}

export function execAsync(cmd) {
  return new Promise((resolve, reject) => {
    return exec(cmd, function(err, stdout, stderr) {
      if (stdout) console.log(stdout);
      if (stderr) console.log(stderr);

      if (err) return reject(err);
      resolve();
    });
  });
}
