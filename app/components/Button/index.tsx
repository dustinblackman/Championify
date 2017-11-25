import React = require("react");
import { Button as BButton } from "reactstrap";

import * as styles from "./styles.scss";

export default class Button extends React.Component {
  render() {
    return (
      <BButton className={[styles.button, styles.button_outer].join(" ")}>
        <span className={styles.button_inner}>{this.props.children}</span>
      </BButton>
    );
  }
}
