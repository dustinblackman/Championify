import React = require("react");
import { connect } from "react-redux";
import Select from "react-select";
import { Button, Col, Container, Input, InputGroup, InputGroupButton, Row } from "reactstrap";
import { bindActionCreators } from "redux";

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
            <InputGroup>
              <Input id="league_path" placeholder="Select League Of Legends.app" />
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
      </Container>
    );
  }
}

export default connect(
  (state: ReducersState) => ({sources: state.source_select.sources}),
  (dispatch) => bindActionCreators(sourceSelectActions, dispatch)
)(Setup);
