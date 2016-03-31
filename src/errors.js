import os from 'os';
import SuperError from 'super-error';
import R from 'ramda';
import T from './translate';


const ChampionifyError = SuperError.subclass('ChampionifyError');
const errors = {ChampionifyError};

const error_types = [
  'FileWriteError',
  'MissingData',
  'OperationalError',
  'ParsingError',
  'TranslationError',
  'UncaughtException',
  'UpdateError'
];

R.forEach(error_name => {
  errors[error_name] = ChampionifyError.subclass(error_name, function() {
    this.type = error_name;
    this.ua = [os.platform(), os.release()].join(' ');
    this.locale = T.locale;
  });
}, error_types);

errors.RequestError = ChampionifyError.subclass('RequestError', function(code, url) {
  this.code = code;
  this.url = url;
  this.type = 'RequestError';
  this.ua = [os.platform(), os.release()].join(' ');
  this.locale = T.locale;
});

export default errors;
