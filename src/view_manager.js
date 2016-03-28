import jade from 'jade';
import path from 'path';
import R from 'ramda';
import $ from './helpers/jquery';
import _ from 'lodash';

import championify from './championify';
import championgg from './sources/championgg';
import { spliceVersion } from './helpers';
import Log from './logger';
import lolflavor from './sources/lolflavor';
import preferences from './preferences';
import sourceUIManager from './source_ui_manager';
import store from './store_manager';
import T from './translate';

const pkg = require('../package.json');



/**
 * Function To change all views with the same transitions.
 * @param {string} name of view
 * @param {function} function to run before loading in new view.
 */

function nub(done) {
  return done();
}

function _viewChanger(view, process, options) {
  if (options == null) {
    options = {};
  }

  const default_options = {
    transition: 'browse',
    div_id: 'view',
    jade: {T}
  };
  if (!process) {
    options = {};
    process = nub;
  }
  if (!_.isFunction(process)) {
    options = process;
    process = nub;
  }
  options = R.merge(default_options, options);
  return $('#' + options.div_id).transition({
    animation: 'fade up',
    onComplete: function() {
      const html = jade.renderFile(path.resolve(path.join(__dirname, '../views/' + view + '.jade')), default_options.jade);
      $('#' + options.div_id).html(html).promise().done(function() {
        process(function() {
          $('#' + options.div_id).transition(options.transition);
        });
      });
    }
  });
}


/**
 * Function Change to complete view with transitions.
 */

// TODO: rewrite
function completeView() {
  function loadUnavailable(done) {
    const undefined_builds = store.get('undefined_builds');
    if (!undefined_builds || !undefined_builds.length) {
      $('#not_available_log').append('<span>' + T.t('all_available') + '</span><br />');
    } else {
      _.each(undefined_builds, function(item) {
        return $('#not_available_log').append('<span>' + T.t(item.champ) + ': ' + T.t(item.position) + '</span><br />');
      });
    }
    return done();
  }
  return _viewChanger('complete', loadUnavailable);
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
  function resetMain(next) {
    $('#cl_progress').html('');
    $('.submit_btns').removeClass('hidden');
    $('.status').attr('class', 'status hidden');
    _initSettings();
    return next();
  }
  return _viewChanger('main', resetMain, {
    transition: 'fly right'
  });
}


/**
 * Function Initial view with settings
 */

function _initSettings() {
  $('#locale_flag').attr('class', (T.flag()) + " flag");
  $('#select_language_text').text("" + (T.t('select_language')));
  $('#locals_select').find(".item[data-value='" + T.locale + "']").addClass('active');
  $('#footer_help').text("" + (T.t('help')));
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
      if (GLOBAL.importing) {
        return null;
      }
      function reset(done) {
        _initSettings();
        return done();
      }
      let local = $selector.attr('data-value');
      T.loadPhrases(local);
      return _viewChanger('_view', reset, {
        div_id: 'parent_view',
        transition: 'fade',
        jade: {
          platform: process.platform
        }
      });
    }
  });

  championify.version()
    .then(version => $('#lol_version').text(spliceVersion(version)))
    .catch(Log.warn);

  championgg.version()
    .then(version => $('#championgg_version').text(version))
    .catch(Log.warn);

  lolflavor.version(function(err, version) {
    if (err) {
      return;
    }
    $('#lolflavor_version').text(version);
  });
  return preferences.set(preferences.load());
}

function init(done) {
  if (process.platform === 'darwin') {
    window.browse_title = (T.t('select')) + ' League of Legends.app';
  } else {
    window.browse_title = (T.t('select')) + ' League of Legends ' + T.t('directory');
  }
  const options = {
    T,
    platform: process.platform,
    version: pkg.version
  };
  const html = jade.renderFile(path.resolve(path.join(__dirname, '../views/index.jade')), options);
  return $('#body').html(html).promise().done(function() {
    _initSettings();
    return done();
  });
}

export default {
  complete: completeView,
  error: errorView,
  update: updateView,
  mainBack: mainViewBack,
  breakingChanges: breakingChangesView,
  init: init
};
