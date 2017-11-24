import React = require("react");
import { Button, Col, Container, Input, InputGroup, InputGroupButton, Row } from "reactstrap";

import * as styles from "./styles.scss";
console.log(styles);

export default class Setup extends React.Component {
  render() {
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
      </Container>
    );
  }
}
