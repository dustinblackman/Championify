import Promise from 'bluebird';
import chalk from 'chalk';
import glob from 'glob';
import gulp from 'gulp';
import path from 'path';
import prompt from 'prompt';
import R from 'ramda';
import request from 'request';

const fs = Promise.promisifyAll(require('fs-extra'));
const GT = Promise.promisify(require('google-translate')(process.env.GOOGLE_TRANSLATE_API).translate);
const requester = Promise.promisify(request);

// TODO: This should be pulled from transifex.
const supported_languages = [
  'ar', // Arabic
  'bs', // Bosnian
  'bg', // Bulgarian
  'ca', // Catalan
  'cs', // Czech
  'da', // Danish
  'de', // German
  'el', // Greek
  'en', // English
  'es', // Spanish
  'fi', // Finish
  'fr', // French
  'he', // Hebrew
  'hi', // Hindi
  'hr', // Croatian
  'hu', // Hungarian
  'id', // Indonesian
  'it', // Italian
  'ja', // Japanese
  'ka', // Georgian
  'km', // Khmer
  'ko', // Korean
  'ms', // Malay
  'no', // Norwegian
  'lt', // Lithuanian
  'lv', // Latvian
  'nl', // Dutch
  'pl', // Polish
  'pt', // Portuguese
  'pt-BR', // Brazillian Portuguese
  'ro', // Romanian
  'ru', // Russian
  'sk', // Slovak
  'sl', // Slovenian
  'sr', // Serbian
  'sv', // Swedish
  'th', // Thai
  'tr', // Turkish
  'vi', // Vietnamese
  'zh-CN', // Chinese Simplified
  'zh-TW' // Chinese Traditional
];

gulp.task('translate', function() {
  const translations_path = path.join(__dirname, '../i18n');
  const translations = R.fromPairs(R.map(file_name => {
    return [path.basename(file_name).replace(/.json/g, ''), require(file_name)];
  }, glob.sync(`${translations_path}/*(!(_source.json))`)));

  const source_path = path.join(translations_path, '_source.json');
  const _source = require(source_path);

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  function translate(lang, key) {
    if (R.is(String, _source[key])) {
      _source[key] = {
        text: _source[key],
        done: false
      };
    }

    if (lang === 'en') {
      translations.en[key] = _source[key].text;
      return;
    }

    if (!_source[key].done || !translations[lang][key]) return GT(_source[key].text, 'en', lang)
      .tap(data => {
        // If the key is the same, sometimes google translate doens't like how letters are capitialized.
        if (_source[key].text === data.translatedText) return GT(toTitleCase(_source[key].text), 'en', lang);
      })
      .then(data => translations[lang][key] = data.translatedText);
  }

  return Promise.resolve(supported_languages)
    .each(lang => {
      console.log(`Translating: ${lang}`);
      if (!translations[lang]) translations[lang] = {};

      return Promise.resolve(R.keys(_source))
        .map(R.curry(translate)(lang), {concurrency: 10})
        .then(() => {
          const sorted_translations = {};
          R.forEach(key => {
            sorted_translations[key] = translations[lang][key];
          }, R.keys(translations[lang]).sort());

          return fs.writeFileAsync(`${translations_path}/${lang}.json`, JSON.stringify(sorted_translations, null, 2));
        });
    })
    .then(() => {
      const sorted_source = {};
      R.forEach(key => {
        sorted_source[key] = _source[key];
        sorted_source[key].done = true;
      }, R.keys(_source).sort());

      return fs.writeFileAsync(source_path, JSON.stringify(sorted_source, null, 2), 'utf8');
    })
    .then(() => console.log('Done'));
});

gulp.task('transifex:upload', function() {
  const translations_path = path.join(__dirname, '../i18n');
  let translations = R.map(file_path => {
    return {
      lang: path.basename(file_path).replace(/.json/g, ''),
      file_path
    };
  }, glob.sync(`${translations_path}/*(!(_source.json|en.json))`));
  translations = [{lang: 'en', file_path: path.join(translations_path, 'en.json')}].concat(translations);

  function uploadTranslation(data) {
    let url;
    if (data.lang === 'en') {
      url = `https://${process.env.TRANSIFEX_KEY}@www.transifex.com/api/2/project/championify/resource/english-source/content/`;
    } else {
      url = `https://${process.env.TRANSIFEX_KEY}@www.transifex.com/api/2/project/championify/resource/english-source/translation/${data.lang}/`;
    }

    console.log(`Uploading: ${data.lang}`);
    const options = {
      method: 'PUT',
      url: url,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data'
      }
    };

    return new Promise((resolve, reject) => {
      const req = request(options, function(err, res, body) {
        if (err) return reject(err);
        console.log(res.statusCode);
        console.log(body);
        resolve();
      });

      req.form().append('file', fs.createReadStream(data.file_path));
    });
  }


  return Promise.resolve(translations)
    .each(uploadTranslation)
    .then(() => console.log('Done'));
});


gulp.task('transifex:review', function() {
  const translations_path = path.join(__dirname, '../i18n');
  const translations = R.fromPairs(R.map(file_name => {
    return [path.basename(file_name).replace(/.json/g, ''), require(file_name)];
  }, glob.sync(`${translations_path}/*(!(_source.json|en.json))`)));
  const _source = require(path.join(translations_path, '_source.json'));

  const new_translations = {};
  const to_review = R.fromPairs(R.map(lang => [lang, {}], R.keys(translations)));
  const transifex_langs = {
    'zh-cn': 'zh-Hans',
    'zh-tw': 'zh-Hant'
  };

  const trans_keys = Promise.resolve(R.keys(translations));
  return trans_keys
    .map(lang => {
      const url = `https://${process.env.TRANSIFEX_KEY}@www.transifex.com/api/2/project/championify/resource/english-source/translation/${transifex_langs[lang] || lang}/?mode=default&file`;
      return requester(url)
        .then(R.prop('body'))
        .then(body => JSON.parse(body))
        .then(body => {
          new_translations[lang] = body;
          R.forEach(key => {
            if (translations[lang][key] !== new_translations[lang][key]) {
              to_review[lang][key] = {
                translation: new_translations[lang][key],
                original: translations[lang][key]
              };
            }
          }, R.keys(body));

          return;
        });
    }, {concurrency: 10})
    .return(trans_keys)
    .each(lang => {
      if (!R.keys(to_review[lang]).length) return;

      return Promise.resolve(R.keys(to_review[lang]))
        .map(key => {
          return GT(to_review[lang][key].translation, lang, 'en')
            .then(res => {
              to_review[lang][key].reserve = res.translatedText;
            });
        }, {concurrency: 1})
        .then(() => {
          R.forEach(key => {
            console.log(`-----------------------------------
  Lang        | ${chalk.white.bold(lang)}
  Key         | ${chalk.bold.red(key)}
  English     | ${chalk.bold.blue(_source[key] ? _source[key].text : '!!!MISSING!!!')}
  Reserve     | ${chalk.bold.green(to_review[lang][key].reserve)}
  Old Trans   | ${chalk.bold.yellow(to_review[lang][key].original)}
  New Trans   | ${chalk.bold.magenta(to_review[lang][key].translation)}`);
          }, R.keys(to_review[lang]));

          return new Promise((resolve, reject) => {
            prompt.start();
            const params = {
              properties: {
                answer: {
                  message: 'Would you like to save these translations? [y/n]',
                  required: true
                }
              }
            };

            prompt.get(params, (err, res) => {
              if (err) return reject(err);

              if (res.answer === 'y') {
                const merged_translations = R.merge(translations[lang], new_translations[lang]);
                resolve(fs.writeFileAsync(path.join(translations_path, `${lang}.json`), JSON.stringify(merged_translations, null, 2), 'utf8'));
              } else {
                console.log(chalk.bold.red('Translation not saved...'));
                resolve();
              }
            });
          });
        });
    })
    .then(() => console.log('Review Done'))
    .catch(err => {
      console.log(err);
      throw err;
    });
});
