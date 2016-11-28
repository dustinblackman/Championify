import electronConsole from 'winston-electron';
import path from 'path';
import R from 'ramda';
import winston from 'winston';

import ChampionifyErrors from './errors';
import { EndSession } from './helpers';
import preferences from './preferences';

/**
 * Winston logger
 */
const Log = new winston.Logger({
  transports: [
    new electronConsole({
      level: process.env.NODE_ENV === 'test' ? 'emerg' : 'debug',
      handleExceptions: true
    }),
    new winston.transports.File({
      filename: path.join(preferences.directory(), 'championify.log.txt'),
      json: false,
      handleExceptions: true,
      prettyPrint: true,
      level: process.env.NODE_ENV === 'test' ? 'emerg' : 'debug',
      options: {flags: 'w'}
    })
  ]
});

Log.exitOnError = function(err) {
  let e;
  if (R.is(String, err)) {
    e = new ChampionifyErrors.UncaughtException(err);
  } else {
    e = new ChampionifyErrors.UncaughtException().causedBy(err);
  }
  EndSession(e);
  return false;
};

export default Log;
