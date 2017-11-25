import React = require("react");
import { connect } from "react-redux";
// import Select from "react-select";
import { Col, Container, InputGroup, Row } from "reactstrap";
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
              <Button size="0.70">Browse</Button>
            </InputGroup>
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
