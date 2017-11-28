import React = require("react");
import { connect } from "react-redux";
// import Select from "react-select";
import { Col, Container, InputGroup, Row } from "reactstrap";
import { bindActionCreators } from "redux";

import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import { ReducersState } from "../../store/reducers";
import { sourceSelectActions, SourceSelectProps } from "../../store/reducers/source-select";

import * as styles from "./styles.scss";

type SourceType = "summoners" | "aram";
type Props = SourceSelectProps;

// TODO: This will likely not need to exist.
interface Source {
  id: string;
  name: string;
  icon: string;
  version: string;
  active: boolean;
}

// TODO This will be generated later.
const summoners_sources: Source[] = [
  {
    id: "championgg",
    name: "Champion.gg",
    icon: require("../../sources/championgg/icon.png"),
    version: "7.23",
    active: true
  },
  {
    id: "koreanbuilds",
    name: "Korean Builds",
    icon: require("../../sources/koreanbuilds/icon.png"),
    version: "7.23",
    active: true
  },
  {
    id: "Lolalytics",
    name: "Lolalytics",
    icon: require("../../sources/lolalytics/icon.png"),
    version: "7.23",
    active: false
  },
  {
    id: "Lolflavor",
    name: "Lolflavor",
    icon: require("../../sources/lolflavor/icon.png"),
    version: "2017-11-26",
    active: true
  },
  {
    id: "lolmasters",
    name: "Lolmasters",
    icon: require("../../sources/lolmasters/icon.png"),
    version: "7.23",
    active: false
  },
  {
    id: "metalol",
    name: "Metalol",
    icon: require("../../sources/metalol/icon.png"),
    version: "7.23",
    active: false
  },
  {
    id: "opgg",
    name: "opgg",
    icon: require("../../sources/opgg/icon.png"),
    version: "7.23",
    active: false
  },
  {
    id: "probuilds",
    name: "Probuilds",
    icon: require("../../sources/probuilds/icon.png"),
    version: "2017-11-26",
    active: false
  }
];

const aram_sources = [
  {
    id: "lolflavor",
    name: "Lolflavor",
    icon: require("../../sources/lolflavor/icon.png"),
    version: "2017-11-26",
    active: false
  },
  {
    id: "metalol",
    name: "Metalol",
    icon: require("../../sources/metalol/icon.png"),
    version: "7.23",
    active: true
  }
];

class Setup extends React.Component<Props, {}> {
  handleSelectSource = (source_id: string, source_type: SourceType) => () => {
    const active = !(this.props.sources[source_type][source_id] || false);
    if (source_type === "aram") {
      this.props.changeAram(source_id, active);
    } else {
      this.props.changeSummoners(source_id, active);
    }
  }

  renderSources = (sources: Source[], source_type: SourceType) => {
    return sources.map(source => (
      <Col key={source.name} xs="6">
        <Checkbox
          onChange={this.handleSelectSource(source.id, source_type)}
          checked={this.props.sources[source_type][source.id] || false}
          id={`${source_type}_${source.id}`}
        />
        <img src={source.icon} />
        <span>{` ${source.name} (${source.version})`}</span>
      </Col>
    ));
  }

  render() {
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
          <Col xs={{size: 8, offset: 2}} className={styles.titlebar}>
            <h4>Summoners Rift</h4>
          </Col>
        </Row>
        <Row className={styles.sources}>
          {this.renderSources(summoners_sources, "summoners")}
        </Row>
        <Row>
          <Col xs={{size: 8, offset: 4}} className={styles.titlebar}>
            <h4>ARAM</h4>
          </Col>
        </Row>
        <Row className={styles.sources}>
          {this.renderSources(aram_sources, "aram")}
        </Row>
      </Container>
    );
  }
}

export default connect(
  (state: ReducersState) => ({sources: state.source_select}),
  (dispatch) => bindActionCreators(sourceSelectActions, dispatch)
)(Setup);
