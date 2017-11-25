import { createStore as _createStore } from "redux";

import reducers from "./reducers";

const dev_tools = window && (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__();

export default function createStore() {
  const store = _createStore(reducers, dev_tools);

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept("./reducers", () => {
      const nextRootReducer = require("./reducers").default;
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}
