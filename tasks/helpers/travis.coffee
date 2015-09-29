request = require 'request'
_ = require 'lodash'

_request = (params, done) ->
  default_params = {
    headers: {
      Accept: 'application/vnd.travis-ci.2+json'
      'User-Agent': 'Championify/1.0.0'
      'Content-Type': 'application/json'
    }
  }

  params = _.merge(_.clone(default_params, true), params)
  request params, (err, res, body) ->
    return done(err) if err
    try
      body = JSON.parse(body)
    catch e
      return done(e)

    done(null, body)

token = (done) ->
  params = {
    url: 'https://api.travis-ci.org/auth/github'
    form: {github_token: process.env.GITHUB_TOKEN}
    method: 'POST'
  }

  _request params, (err, body) ->
    return done(err) if err
    done(null, body.access_token)


module.exports = {
  request: _request
  token: token
}
