import React = require("react");
import { connect } from "react-redux";
// import Select from "react-select";
import { Col, Container, FormGroup, Input, InputGroup, Label, Row } from "reactstrap";
import { bindActionCreators } from "redux";

import Button from "../../components/Button";
import { ReducersState } from "../../store/reducers";
import { sourceSelectActions, SourceSelectProps } from "../../store/reducers/source-select";

import * as styles from "./styles.scss";

type Props = SourceSelectProps;

// TODO This will be generated later.
const sources = [
  {
    name: "Champion.gg",
    icon: require("../../sources/championgg/icon.png"),
    version: "7.23"
  },
  {
    name: "Korean Builds",
    icon: require("../../sources/koreanbuilds/icon.png"),
    version: "7.23"
  },
  {
    name: "Lolalytics",
    icon: require("../../sources/lolalytics/icon.png"),
    version: "7.23"
  },
  {
    name: "Lolflavor",
    icon: require("../../sources/lolflavor/icon.png"),
    version: "2017-11-26"
  },
  {
    name: "Lolmasters",
    icon: require("../../sources/lolmasters/icon.png"),
    version: "7.23"
  },
  {
    name: "opgg",
    icon: require("../../sources/opgg/icon.png"),
    version: "7.23"
  },
  {
    name: "Probuilds",
    icon: require("../../sources/probuilds/icon.png"),
    version: "2017-11-26"
  }
];

class Setup extends React.Component<Props, {}> {
  renderSources = () => {
    return sources.map(source => (
      <Col xs="6">
        <FormGroup check={true}>
          <Label check={true}>
            <Input type="checkbox" />
            <img src={source.icon} />
            <span>{` ${source.name} (${source.version})`}</span>
          </Label>
        </FormGroup>
      </Col>
    ));
  }

  render() {
    // TODO Replace.
    // const select_options = [
      // { value: "one", label: "One" },
      // { value: "two", label: "Two" }
    // ];

    return (
      <Container className={styles.top_padding}>
        <Row>
          <Col>
            <InputGroup>
              <input type="text" className={styles.input_box} placeholder={"Select League of Legends.app"} />
              <Button size="0.72">Browse</Button>
            </InputGroup>
          </Col>
        </Row>
        <Row>
          <Col />
          <Col className={styles.titlebar}>
            <h2>Profile</h2>
          </Col>
          <Col />
        </Row>
        <Row className={styles.sources}>
          {this.renderSources()}
        </Row>
      </Container>
    );
  }
}

// TODO Fix state for this.
export default connect(
  (state: ReducersState) => ({sources: state.source_select.sources}),
  (dispatch) => bindActionCreators(sourceSelectActions, dispatch)
)(Setup);
