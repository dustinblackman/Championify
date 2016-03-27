// A simple workaround to make sure to the appeneded functions from Semantic get applied to all jquery instances used.

import jquery from 'jquery';

let $;
if (typeof window !== 'undefined') {
  // Setup Semantic UI
  $ = window.$ = window.jQuery = jquery;
  require('semantic-ui-css/semantic.min');
} else {
  $ = jquery;
}

export default $;
