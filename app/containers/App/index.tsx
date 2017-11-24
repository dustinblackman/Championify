import React = require("react");
import { TitleBar } from "react-desktop";
import Setup from "../Setup";

import "./style.scss";
require("bootstrap/dist/css/bootstrap.css");

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
