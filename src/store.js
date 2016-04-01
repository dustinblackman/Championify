/**
 * @class Store
 * @classdesc A global stores for setting and grabbing information within Championify
 */

class Store {
  constructor() {
    this.store = {};
  }

  /**
   * Gets value of key
   * @param {String} Key
   * @returns Value
   */

  get(key) {
    return this.store[key];
  }

  /**
   * Sets value of key
   * @param {String} Key
   * @param Value
   */

  set(key, value) {
    this.store[key] = value;
  }

  /**
   * Pushes value of key to an array
   * @param {String} Key
   * @param Value
   */

  push(key, value) {
    if (!this.store[key]) this.store[key] = [];
    this.store[key].push(value);
  }

  /**
   * Remove keys from store if it exists
   * @param {String} Key
   */

  remove(key) {
    if (this.store[key]) delete this.store[key];
  }
}

const store = new Store();
export default store;
