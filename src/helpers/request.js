import Promise from 'bluebird';
import R from 'ramda';
import retry from 'bluebird-retry';

import ChampionifyErrors from '../errors';

const requester = Promise.promisify(require('request'));

/**
 * Request retry configuration
 * @type {{max_tries: number, interval: number, backoff: number, timeout: number, throw_original: boolean}}
 */
const retry_options = {
  max_tries: 3,
  interval: 1000,
  backoff: 2,
  timeout: 30000,
  throw_original: true
};

/**
 * Limits for concurrent connections
 * The specified limits are based on existing limits in modern browsers (e.g firefox, chrome)
 * @type {{max_concurrent: number, max_concurrent_per_host: number}}
 */
const connection_limits = {
  max_concurrent: 17,
  max_concurrent_per_host: 6
};

/**
 * Counter for currently running requests
 * @type {{total: number, per_host: {}}}
 */
let active_connections = {
  total: 0,
  per_host: {}
};

/**
 * List for pending requests that have not been started yet
 * @type {Array}
 */
let waiting_tasks = [];

/**
 * Checks if a request to the given hostname can be started
 * @param {String} hostname
 * @returns {boolean}
 */
function canStartRequest(hostname) {
  return active_connections.total < connection_limits.max_concurrent &&
      (active_connections.per_host[hostname] || 0) < connection_limits.max_concurrent_per_host;
}

/**
 * Updates the request counter for the given hostname on request start
 * @param {String} hostname
 */
function onRequestStart(hostname) {
  active_connections.total++;
  active_connections.per_host[hostname] = (active_connections.per_host[hostname] || 0) + 1;
}

/**
 * Starts all requests that do not exceed request limits
 * This method is invoked whenever a new request has been queued or a running request finished
 */
function startAllAllowedRequests() {
  for (let i = 0; i < waiting_tasks.length; i++) {
    if (canStartRequest(waiting_tasks[i].hostname)) {
      onRequestStart(waiting_tasks[i].hostname);
      waiting_tasks[i].start();

      // remove request from waiting requests list and update loop index
      waiting_tasks.splice(i, 1);
      i--;
    }
  }
}

/**
 * Updates the request counter for the given hostname on request finish
 * This method also invokes startAllAllowedRequests() after updating request counters
 * @param {String} hostname
 */
function onRequestFinish(hostname) {
  active_connections.total--;
  active_connections.per_host[hostname]--;

  if (active_connections.per_host[hostname] === 0) {
    delete active_connections.per_host[hostname];
  }

  startAllAllowedRequests();
}

/**
 * Extracts the hostname (as of RFC-3986) from the given url
 * @param {String} url
 * @returns {String} Hostname
 */
function getHostnameFromUrl(url) {
  const parts = url.match(/^(\w+:(\/\/)?)?([^:\/?#]*).*$/);
  return parts ? parts[3] : '';
}

/**
 * Makes request with retry and 404 handling
 * @param {Object/String} options
 * @returns {Promise.<Object|ChampionifyErrors.RequestError>} Request body
 */
export function request(options) {
  let params = {timeout: 10000};

  if (R.is(String, options)) {
    params.url = options;
  } else {
    params = R.merge(params, options);
  }

  const hostname = getHostnameFromUrl(params.url);

  return retry(() => {
    return new Promise((resolve, reject) => {
      waiting_tasks.push({
        hostname: hostname,
        start: () => requester(params)
            .then(res => {
              onRequestFinish(hostname);

              if (res.statusCode >= 400) {
                reject(new ChampionifyErrors.RequestError(res.statusCode, params.url, res.body));
              } else {
                resolve(res.body);
              }
            })
            .catch(err => {
              onRequestFinish(hostname);
              reject(new ChampionifyErrors.RequestError(err.name, params.url, err));
            })
      });

      startAllAllowedRequests();
    });
  }, retry_options);
}
