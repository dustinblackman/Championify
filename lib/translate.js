import fs from 'fs';
import path from 'path';
import _ from 'lodash';

import cErrors from './errors';

const ingame_locals = ['ar', 'ja'];

// TODO: Rewrite all of this.

function Translate(locale) {
  var i18n_path;
  this.locale = locale;
  i18n_path = path.join(__dirname, '../i18n/' + locale + '.json');
  if (!fs.existsSync(i18n_path)) {
    throw new cErrors.OperationalError(locale + ' does not exist in i18n folder');
  }
  this.phrases = require(i18n_path);
  this.english_phrases = require(path.join(__dirname, '../i18n/en.json'));
}

Translate.prototype.t = function(phrase, ingame) {
  var translated_phrase;
  phrase = phrase.toLowerCase();
  translated_phrase = this.phrases[phrase];
  if (ingame && _.includes(ingame_locals, this.locale)) {
    translated_phrase = this.english_phrases[phrase];
  }
  if (!translated_phrase) {
    throw new cErrors.TranslationError('Phrase does not exist for ' + this.locale + ': ' + phrase);
  }
  return translated_phrase;
};

Translate.prototype.flag = function() {
  var flags;
  flags = {
    en: 'gb',
    'zh-CN': 'cn',
    'zh-TW': 'tw',
    cs: 'cz',
    el: 'gr',
    he: 'il',
    ja: 'jp',
    ko: 'kr',
    ms: 'my',
    vi: 'vn',
    'pt-BR': 'br',
    bs: 'ba',
    ca: 'es',
    da: 'dk',
    ka: 'ge',
    sr: 'cs',
    sl: 'si',
    sv: 'se',
    ar: 'eg'
  };
  return flags[this.locale] || this.locale;
};

Translate.prototype.merge = function(translations) {
  translations = _.mapKeys(translations, function(value, key) {
    return key.toLowerCase().replace(/ /g, '');
  });

  this.phrases = _.merge(this.phrases, translations);
};

Translate.prototype.riotLocale = function() {
  var riot_locales;
  riot_locales = {
    bg: 'bg_BG',
    cs: 'cs_CZ',
    de: 'de_DE',
    el: 'el_GR',
    en: 'en_US',
    es: 'es_ES',
    fr: 'fr_FR',
    hu: 'hu_HU',
    id: 'id_ID',
    it: 'it_IT',
    ja: 'ja_JP',
    ko: 'ko_KR',
    nl: 'nl_NL',
    ms: 'ms_MY',
    pl: 'pl_PL',
    pt: 'pt_BR',
    'pt-BR': 'pt_BR',
    ro: 'ro_RO',
    ru: 'ru_RU',
    th: 'th_TH',
    tr: 'tr_TR',
    vi: 'vn_VN',
    'zh-CN': 'zh_CN',
    'zh-TW': 'zh_TW'
  };
  return riot_locales[this.locale] || 'en_US';
};

module.exports = Translate;
