class Store {
  constructor() {
    this.store = {};
  }

  get(key) {
    return this.store[key];
  }

  set(key, value) {
    this.store[key] = value;
  }

  push(key, value) {
    if (!this.store[key]) this.store[key] = [];
    this.store[key].push(value);
  }

  remove(key) {
    if (this.store[key]) delete this.store[key];
  }
}

const store = new Store();
export default store;
