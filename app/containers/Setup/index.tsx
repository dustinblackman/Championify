import React = require("react");
import { connect } from "react-redux";
import Select from "react-select";
import { Col, Container, Input, InputGroup, InputGroupButton, Row } from "reactstrap";
import { bindActionCreators } from "redux";

import Button from "../../components/Button";
import { ReducersState } from "../../store/reducers";
import { sourceSelectActions, SourceSelectOption, SourceSelectProps } from "../../store/reducers/source-select";

import * as styles from "./styles.scss";

type Props = SourceSelectProps;

class Setup extends React.Component<Props, {}> {
  handleSourceSelect = (selected: SourceSelectOption[]) => {
    this.props.changeSources(selected);
  }

  render() {
    // TODO Replace.
    const select_options = [
      { value: "one", label: "One" },
      { value: "two", label: "Two" }
    ];

    return (
      <Container className={styles.top_padding}>
        <Row>
          <Col>
            <input type="text" className={styles.input_box} placeholder={"Select League of Legends.app"}/>
          </Col>
        </Row>
        <br />
        <Row>
          <Col>
            <InputGroup>
              <Input className={styles.input_box} id="league_path" placeholder="Select League Of Legends.app" />
              <InputGroupButton><Button>Browse</Button></InputGroupButton>
            </InputGroup>
          </Col>
        </Row>
        <Row className={styles.top_padding}>
          <Col>
            <Select
              name="source-selection"
              value={this.props.sources}
              multi={true}
              onChange={this.handleSourceSelect}
              options={select_options}
            />
          </Col>
        </Row>
        <Row>
          <Col />
          <Col>
            <h3 style={{color: "white"}}>Sources</h3>
          </Col>
          <Col />
        </Row>
      </Container>
    );
  }
}

export default connect(
  (state: ReducersState) => ({sources: state.source_select.sources}),
  (dispatch) => bindActionCreators(sourceSelectActions, dispatch)
)(Setup);
