import fs from 'fs';
import glob from 'glob';
import { load as markoLoad } from 'marko';
import path from 'path';
import R from 'ramda';
import $ from './helpers/jquery';

import championify from './championify';
import { spliceVersion } from './helpers';
import Log from './logger';
import preferences from './preferences';
import sources, { sources_info } from './sources';
import store from './store';
import T from './translate';

const pkg = require('../package.json');

// Marko template renders
const pre_rendered = fs.existsSync(path.join(__dirname, '../views/index.marko.js'));
require('marko/compiler').defaultOptions.writeToDisk = !pre_rendered;
require('marko/compiler').defaultOptions.assumeUpToDate = pre_rendered;
const marko = R.fromPairs(R.map(file_path => {
  return [path.basename(file_path, '.marko'), markoLoad(file_path)];
}, glob.sync(path.join(__dirname, '../views/*.marko'))));


/**
 * Helper to grab the selected sources if any.
 */

function _selectedSources() {
  const prefs = preferences.load();
  return prefs && prefs.options && prefs.options.sr_source ? R.join(',', R.filter(R.identity, prefs.options.sr_source)) : '';
}

function _setBrowseTitle() {
  if (process.platform === 'darwin') {
    store.set('browse_title', `${T.t('select')} League of Legends.app`);
  } else {
    store.set('browse_title', `${T.t('select')} League of Legends ${T.t('directory')}`);
  }
}


/**
 * Change all views with the same transitions.
 * @param {String} Name of view
 * @param {Object} Options to be passed to Jade render
 * @param {Function} [nub] Function to load before view
 */

function _viewChanger(view, options = {}, next) {
  _setBrowseTitle();
  const default_options = {
    transition: 'browse',
    div_id: 'view',
    render: {T, browse_title: store.get('browse_title')}
  };

  options = Object.assign(
    {},
    default_options,
    options,
    {render: R.merge(default_options.render, options.render || {})}
  );
  return $(`#${options.div_id}`).transition({
    animation: 'fade up',
    onComplete: function() {
      const html = marko[view].renderSync(options.render);
      $(`#${options.div_id}`).html(html).promise().then(() => {
        if (next) next();
        $(`#${options.div_id}`).transition(options.transition);
      });
    }
  });
}

/**
 * Sets initial view with settings
 */

function _initSettings() {
  $('#locale_flag').attr('class', `${T.flag()} flag`);
  $('#select_language_text').text(T.t('select_language'));
  $('#locals_select').find(`.item[data-value='${T.locale}']`).addClass('active');
  $('#footer_help').text(T.t('help'));
  $('.ui.popup.top.left.transition.visible').remove();
  $('.options_tooltip').popup();
  $('.ui.dropdown').dropdown();

  $('#locals_select').dropdown({
    action: 'activate',
    onChange: function(value, text, $selector) {
      if (store.get('importing')) return null;

      T.loadPhrases($selector.attr('data-value'));
      _setBrowseTitle();
      return _viewChanger('main', {
        div_id: 'view',
        transition: 'fade',
        render: {
          browse_title: store.get('browse_title'),
          platform: process.platform,
          sources: sources_info,
          selected_sources: _selectedSources()
        }
      }, _initSettings);
    }
  });

  if (store.get('lol_ver')) {
    $('#lol_version').text(store.get('lol_ver'));
  } else {
    championify.getVersion()
      .then(version => {
        version = spliceVersion(version);
        $('#lol_version').text(version);
        store.set('lol_ver', version);
      })
      .catch(Log.warn);
  }

  R.forEach(source => {
    if (store.get(`${source.id}_ver`)) {
      $(`#${source.id}_version`).text(store.get(`${source.id}_ver`));
    } else {
      sources[source.id].getVersion()
        .then(version => $(`#${source.id}_version`).text(version))
        .catch(Log.warn);
    }
  }, sources_info);

  return preferences.set(preferences.load());
}

/**
 * Change to complete view with transitions.
 */

function completeView() {
  function loadUnavailable() {
    const undefined_builds = R.sortBy(R.prop('source'), store.get('undefined_builds') || [])
      .map(entry => {
        const champ_translation = T.t(entry.champ);
        if (!champ_translation) return;
        return `<span>${entry.source} ${champ_translation}: ${T.t(entry.position)}</span><br />`;
      })
      .filter(R.identity);

    if (!undefined_builds.length) {
      $('#not_available_log').append(`<span>${T.t('all_available')}</span><br />`);
    } else {
      undefined_builds.forEach(entry => $('#not_available_log').append(entry));
    }
  }
  return _viewChanger('complete', {}, loadUnavailable);
}


/**
 * Change to error view with transitions.
 */

function errorView() {
  return _viewChanger('error');
}


/**
 * Change to complete view with transitions.
 */

function updateView() {
  return _viewChanger('update');
}


/**
 * Change to breaking changes view with transitions.
 */

function manualUpdateView() {
  return _viewChanger('manual_update');
}

/**
 * Change to main view with reverse transitions.
 */

function mainViewBack() {
  function resetMain() {
    $('#cl_progress').html('');
    $('.submit_btns').removeClass('hidden');
    $('.status').attr('class', 'status');
    _initSettings();
  }

  return _viewChanger('main', {
    transition: 'fly right',
    render: {
      browse_title: store.get('browse_title'),
      sources: sources_info,
      selected_sources: _selectedSources()
    }
  }, resetMain);
}

/**
 * Loads initial view when the app loads.
 * @returns {Promise}
 */

function init() {
  _setBrowseTitle();
  const options = {
    T,
    browse_title: store.get('browse_title'),
    platform: process.platform,
    sources: sources_info,
    selected_sources: _selectedSources(),
    version: pkg.version
  };

  const html = marko.index.renderSync(options);
  return $('#body').html(html).promise().then(() => _initSettings());
}

export default {
  complete: completeView,
  error: errorView,
  update: updateView,
  mainBack: mainViewBack,
  manualUpdate: manualUpdateView,
  init
};
