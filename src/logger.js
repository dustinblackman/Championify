import path from 'path';
import R from 'ramda';
import winston from 'winston';

import cErrors from './errors';
import { EndSession } from './helpers';
import preferences from './preferences';

const Log = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: true
    }),
    new winston.transports.File({
      filename: path.join(preferences.directory(), 'championify.log.txt'),
      handleExceptions: true,
      prettyPrint: true,
      level: 'debug',
      options: {flags: 'w'}
    })
  ]
});

Log.exitOnError = function(err) {
  let e;
  if (R.is(String, err)) {
    e = new cErrors.UncaughtException(err);
  } else {
    e = new cErrors.UncaughtException().causedBy(err);
  }
  EndSession(e);
  return false;
};

export default Log;
