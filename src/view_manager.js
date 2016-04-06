import jade from 'jade';
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

function nub() {}

function _viewChanger(view, options = {}, next = nub) {
  _setBrowseTitle();
  const default_options = {
    transition: 'browse',
    div_id: 'view',
    jade: {
      T,
      browse_title: store.get('browse_title')
    }
  };

  options = R.merge(default_options, options);
  return $(`#${options.div_id}`).transition({
    animation: 'fade up',
    onComplete: function() {
      const html = jade.renderFile(path.resolve(path.join(__dirname, `../views/${view}.jade`)), options.jade);
      $(`#${options.div_id}`).html(html).promise().then(() => {
        next();
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
        jade: {
          T,
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
    const undefined_builds = store.get('undefined_builds');
    if (!undefined_builds || !undefined_builds.length) {
      $('#not_available_log').append('<span>' + T.t('all_available') + '</span><br />');
    } else {
      R.forEach(item => {
        $('#not_available_log').append(`<span>${item.source} ${T.t(item.champ)}: ${T.t(item.position)}</span><br />`);
      }, R.sortBy(R.prop('source'))(undefined_builds));
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

function breakingChangesView() {
  return _viewChanger('breaking_changes');
}

/**
 * Change to main view with reverse transitions.
 */

function mainViewBack() {
  function resetMain() {
    $('#cl_progress').html('');
    $('.submit_btns').removeClass('hidden');
    $('.status').attr('class', 'status hidden');
    _initSettings();
  }

  return _viewChanger('main', {
    transition: 'fly right',
    jade: {
      T,
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

  const html = jade.renderFile(path.resolve(path.join(__dirname, '../views/index.jade')), options);
  return $('#body').html(html).promise().then(() => _initSettings());
}

export default {
  complete: completeView,
  error: errorView,
  update: updateView,
  mainBack: mainViewBack,
  breakingChanges: breakingChangesView,
  init
};
