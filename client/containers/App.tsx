import React = require("react");
import { TitleBar } from "react-desktop";

export default class App extends React.Component {
  render() {
    return (
      <TitleBar
        controls={true}
        isFullscreen={true}
        transparent={true}
      />
    );
  }
}
