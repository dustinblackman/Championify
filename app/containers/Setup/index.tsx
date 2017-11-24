import React = require("react");
import Select from "react-select";
import { Button, Col, Container, Input, InputGroup, InputGroupButton, Row } from "reactstrap";

import * as styles from "./styles.scss";

export default class Setup extends React.Component {
  render() {
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
              name="form-field-name"
              options={select_options}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}
