import React = require("react");

import * as styles from "./styles.scss";

interface Props {
  checked: boolean;
  id: string;
  onChange: () => void;
}

export default class Checkbox extends React.Component<Props, {}> {
  render() {
    return (
      <div className={styles.checkbox}>
        <input type="checkbox" id={this.props.id} checked={this.props.checked} onChange={this.props.onChange} />
        <label htmlFor={this.props.id}><span /></label>
      </div>
    );
  }
}
