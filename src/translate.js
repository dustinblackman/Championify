import fs from 'fs';
import path from 'path';
import R from 'ramda';

import ChampionifyErrors from './errors';
import Log from './logger';

// Ingame locales are locals that LoL does not support, and instead default to English.
const ingame_locals = ['ar', 'ja'];

/**
 * @class Translate
 * @classdesc Global translation methods to get and set translations throughout the app. Default locale is English.
 */

class Translate {
  constructor(locale) {
    this.loadPhrases(locale);
  }

  /**
   * Loads locales from file in to context
   * @param {String} Locale
   */
  loadPhrases(locale) {
    this.locale = locale;
    const i18n_path = path.join(__dirname, `../i18n/${locale}.json`);
    if (!fs.existsSync(i18n_path)) throw new ChampionifyErrors.OperationalError(`${locale} does not exist in i18n folder`);

    this.phrases = require(i18n_path);
    this.english_phrases = require(path.join(__dirname, '../i18n/en.json'));
  }

  /**
   * Returns translate text for key
   * @param {String} Phrase key
   * @param {Boolean} [false] If this is an ingame translation, it checks whether the locale is an accept League of Legends language
   */

  t(phrase, ingame) {
    phrase = phrase.toLowerCase();
    let translated_phrase = this.phrases[phrase];
    if (ingame && R.contains(this.locale, ingame_locals)) {
      translated_phrase = this.english_phrases[phrase];
    }
    if (!translated_phrase) {
      Log.error(new ChampionifyErrors.TranslationError(`Phrase does not exist for ${this.locale}: ${phrase}`));
      return;
    }
    return translated_phrase;
  }

  /**
   * Merges translations with current translations in context. Used for getting translated Champion names from riot.
   * @param {Object} Translations to merge
   */
  merge(translations) {
    this.phrases = R.merge(this.phrases, translations);
  }

  // TODO: This should get moved somewhere else.
  /**
   * Returns the flag locale to be used with Semantic
   */
  flag() {
    const flags = {
      'pt-BR': 'br',
      'zh-CN': 'cn',
      'zh-TW': 'tw',
      ar: 'eg',
      bs: 'ba',
      ca: 'es',
      cs: 'cz',
      da: 'dk',
      el: 'gr',
      en: 'gb',
      he: 'il',
      hi: 'in',
      ja: 'jp',
      ka: 'ge',
      km: 'kh',
      ko: 'kr',
      ms: 'my',
      sl: 'si',
      sr: 'rs',
      sv: 'se',
      vi: 'vn'
    };
    return flags[this.locale] || this.locale;
  }

  // TODO: This should get moved somewhere else.
  /**
   * Returns the riot locale to be used when querying Riot's api.
   */
  riotLocale() {
    const riot_locales = {
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
  }
}

const translate = new Translate('en');
export default translate;
