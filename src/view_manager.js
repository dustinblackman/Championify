import jade from 'jade';
import path from 'path';
import R from 'ramda';
import $ from './helpers/jquery';

import championify from './championify';
import championgg from './sources/championgg';
import { spliceVersion } from './helpers';
import Log from './logger';
import lolflavor from './sources/lolflavor';
import preferences from './preferences';
import sourceUIManager from './source_ui_manager';
import store from './store';
import T from './translate';

const pkg = require('../package.json');


/**
 * Function To change all views with the same transitions.
 * @param {string} name of view
 * @param {function} function to run before loading in new view.
 */

function nub() {}

function _viewChanger(view, options = {}, next = nub) {
  if (process.platform === 'darwin') {
    store.set('browse_title', `${T.t('select')} League of Legends.app`);
  } else {
    store.set('browse_title', `${T.t('select')} League of Legends ${T.t('directory')}`);
  }

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
      const html = jade.renderFile(path.resolve(path.join(__dirname, `../views/${view}.jade`)), default_options.jade);
      $(`#${options.div_id}`).html(html).promise().then(() => {
        next();
        $(`#${options.div_id}`).transition(options.transition);
      });
    }
  });
}

/**
 * Function Initial view with settings
 */

function _initSettings() {
  $('#locale_flag').attr('class', `${T.flag()} flag`);
  $('#select_language_text').text(T.t('select_language'));
  $('#locals_select').find(`.item[data-value='${T.locale}']`).addClass('active');
  $('#footer_help').text(T.t('help'));
  $('.ui.popup.top.left.transition.visible').remove();
  $('.options_tooltip').popup();
  $('.ui.dropdown').dropdown();

  $('#sr_source').dropdown({
    action: 'activate',
    onChange: function(value) {
      if (value === 'lolflavor') {
        sourceUIManager.lolflavor();
      } else {
        sourceUIManager.championgg();
      }
    }
  });

  $('#locals_select').dropdown({
    action: 'activate',
    onChange: function(value, text, $selector) {
      if (store.get('importing')) return null;

      T.loadPhrases($selector.attr('data-value'));
      return _viewChanger('_view', {
        div_id: 'parent_view',
        transition: 'fade',
        jade: {
          platform: process.platform
        }
      }, _initSettings);
    }
  });

  if (store.get('lol_ver')) {
    $('#lol_version').text(store.get('lol_ver'));
  } else {
    championify.version()
      .then(version => {
        version = spliceVersion(version);
        $('#lol_version').text(version);
        store.set('lol_ver', version);
      })
      .catch(Log.warn);
  }

  if (store.get('champgg_ver')) {
    $('#championgg_version').text(store.get('champgg_ver'));
  } else {
    championgg.version()
      .then(version => $('#championgg_version').text(version))
      .catch(Log.warn);
  }

  if (store.get('lolflavor_ver')) {
    $('#lolflavor_version').text(store.get('lolflavor_ver'));
  } else {
    lolflavor.version()
      .then(version => {
        $('#lolflavor_version').text(version);
        store.set('lolflavor_ver', version);
      })
      .catch(Log.warn);
  }

  return preferences.set(preferences.load());
}

/**
 * Function Change to complete view with transitions.
 */


function completeView() {
  function loadUnavailable() {
    const undefined_builds = store.get('undefined_builds');
    if (!undefined_builds || !undefined_builds.length) {
      $('#not_available_log').append('<span>' + T.t('all_available') + '</span><br />');
    } else {
      R.forEach(item => {
        $('#not_available_log').append(`<span>${T.t(item.champ)}: ${T.t(item.position)}</span><br />`);
      }, undefined_builds);
    }
  }
  return _viewChanger('complete', {}, loadUnavailable);
}


/**
 * Function Change to error view with transitions.
 */

function errorView() {
  return _viewChanger('error');
}


/**
 * Function Change to complete view with transitions.
 */

function updateView() {
  return _viewChanger('update');
}


/**
 * Function Change to breaking changes view with transitions.
 */

function breakingChangesView() {
  return _viewChanger('breaking_changes');
}


/**
 * Function Change to main view with reverse transitions.
 */

function mainViewBack() {
  function resetMain() {
    $('#cl_progress').html('');
    $('.submit_btns').removeClass('hidden');
    $('.status').attr('class', 'status hidden');
    _initSettings();
  }
  return _viewChanger('main', {transition: 'fly right'}, resetMain);
}

function init() {
  if (process.platform === 'darwin') {
    store.set('browse_title', `${T.t('select')} League of Legends.app`);
  } else {
    store.set('browse_title', `${T.t('select')} League of Legends ${T.t('directory')}`);
  }
  const options = {
    T,
    browse_title: store.get('browse_title'),
    platform: process.platform,
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
  init: init
};
