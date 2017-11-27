import React = require("react");
// import { Button as BButton } from "reactstrap";

import * as styles from "./styles.scss";

interface Props {
  size?: string;
}

export default class Button extends React.Component<Props, {}> {
  render() {
    const size = this.props.size || "0.75";
    return (
      <button className={styles.button} style={{fontSize: `${size}em`}}>
        <span>{this.props.children}</span>
      </button>
    );
  }
}
