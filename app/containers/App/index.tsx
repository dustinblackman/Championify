import React = require("react");
import { TitleBar } from "react-desktop";
import Setup from "../Setup";

import "./style.scss";

// All universal imports happen here.
require("bootstrap/dist/css/bootstrap.css");
require("react-select/dist/react-select.css");

export default class App extends React.Component {
  render() {
    return (
      <div>
        <TitleBar
          controls={true}
          isFullscreen={true}
          transparent={true}
        />
        <Setup />
      </div>
    );
  }
}
