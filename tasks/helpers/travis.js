import Promise from 'bluebird';
import R from 'ramda';

const requester = Promise.promisify(require('request'));


function request(params, done) {
  const default_params = {
    headers: {
      Accept: 'application/vnd.travis-ci.2+json',
      'User-Agent': 'Championify/1.0.0',
      'Content-Type': 'application/json'
    },
    json: true
  };
  params = R.merge(R.clone(default_params, true), params);
  return requester(params);
}

function token() {
  const params = {
    url: 'https://api.travis-ci.org/auth/github',
    form: {github_token: process.env.GITHUB_TOKEN},
    method: 'POST'
  };

  return request(params)
    .then(R.path(['body', 'access_token']));
}

module.exports = {
  request,
  token
};
