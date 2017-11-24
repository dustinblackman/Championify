import React = require("react");
import { render } from "react-dom";
import { AppContainer } from "react-hot-loader";
import { Provider } from "react-redux";

import App from "./containers/App";
import createStore from "./store";

render(
  <AppContainer>
    <Provider store={createStore()}>
      <App/>
    </Provider>
  </AppContainer>,
  document.getElementById("root")
);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept("./containers/App", () => {
    const NextApp = require("./containers/App").default; // tslint:disable-line
    render(
      <AppContainer>
        <Provider store={createStore()}>
          <NextApp />
        </Provider>
      </AppContainer>,
      document.getElementById("root")
    );
  });
}
