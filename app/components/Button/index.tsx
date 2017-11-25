import React = require("react");
// import { Button as BButton } from "reactstrap";

import * as styles from "./styles.scss";

export default class Button extends React.Component {
  render() {
    return (
      <button className={styles.button}>
        <span>{this.props.children}</span>
      </button>
    );
  }
}
