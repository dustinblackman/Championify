import Promise from 'bluebird';
import R from 'ramda';

const request = Promise.promisify(require('request'));


export default function travis(params, done) {
  const default_params = {
    headers: {
      Accept: 'application/vnd.travis-ci.2+json',
      'User-Agent': 'Championify/1.0.0',
      'Content-Type': 'application/json'
    },
    json: true
  };
  params = R.merge(R.clone(default_params, true), params);
  return request(params).then(R.prop('body'));
}
