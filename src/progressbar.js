import remote from 'remote';
import $ from './helpers/jquery';

import store from './store';


class ProgressBar {
  constructor() {
    this.precentage = 0;
  }

  reset() {
    this.precentage = 0;
  }

  incrUI(id, incr = this.precentage) {
    let floored = Math.floor(incr);
    if (floored > 100) floored = 100;

    $(`#${id}`).attr('data-percent', floored);
    $(`#${id}`).find('.bar').css('width', `${floored}%`);
    return $(`#${id}`).find('.progress').text(`${floored}%`);
  }

  /**
   * Updates the progress bar on the interface.
   * @param {Number} Increment progress bar.
   */

  incr(incr) {
    if (process.env.NODE_ENV === 'test') return;

    this.precentage += incr;
    this.incrUI('itemsets_progress_bar', this.precentage);
    if (this.precentage >= 100) {
      remote.getCurrentWindow().setProgressBar(-1);
    } else {
      remote.getCurrentWindow().setProgressBar(this.precentage / 100);
    }
  }

  /**
   * Increment for when processing champs and calculates the precentage.
   * @param {Number} [1] The amount of times to be called before it's considered an increase (see Lolflavor)
   */

  incrChamp(divisiable = 1) {
    if (process.env.NODE_ENV === 'test') return;

    const settings = store.get('settings');
    const champs = store.get('champs').length;
    let sources = settings.sr_source.length;
    if (settings.aram) sources++;

    this.incr(100 / champs / sources / divisiable);
  }
}

const progressbar = new ProgressBar();
export default progressbar;
