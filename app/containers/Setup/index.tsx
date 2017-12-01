import React = require("react");
import { connect } from "react-redux";
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

// TODO: What should happen is text will not be here, and it'll use the translate module with the key settings_* as the
// translation key. Verify id names with existing settings
interface Setting {
  id: string;
  text: string;
}
const settings: Setting[] = [
  {
    id: "split_items",
    text: "Split Up Item Sets"
  },
  {
    id: "shorthand",
    text: "Use shorthand for skill order"
  },
  {
    id: "consumables",
    text: "Enable consumables"
  },
  {
    id: "trinkets",
    text: "Enable trickets"
  },
  {
    id: "sr_only",
    text: "Do not show SR items on other maps"
  },
  {
    id: "old_item_sets",
    text: "Don't delete old item sets"
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

  renderSettings = (settings: Setting[]) => {
    // TODO Replace onChange
    return settings.map(setting => (
      <Col key={setting.id} xs="8">
        <Checkbox
          onChange={this.handleSelectSource(setting.id, "aram")}
          checked={false}
          id={setting.id}
        />
        <span>{setting.text}</span>
      </Col>
    ));
  }

  // TODO Move titlebars in to component. Rename to something like "Header".
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
          <Col xs="8" className={styles.titlebar}>
            <h4>Summoners Rift</h4>
          </Col>
        </Row>
        <Row className={styles.sources}>
          {this.renderSources(summoners_sources, "summoners")}
        </Row>
        <Row>
          <Col xs="8" className={styles.titlebar}>
            <h4>ARAM</h4>
          </Col>
        </Row>
        <Row className={styles.sources}>
          {this.renderSources(aram_sources, "aram")}
        </Row>
        <Row>
          <Col xs="8" className={styles.titlebar}>
            <h4>Settings</h4>
          </Col>
        </Row>
        <Row className={styles.sources}>
          {this.renderSettings(settings)}
        </Row>
      </Container>
    );
  }
}

export default connect(
  (state: ReducersState) => ({sources: state.source_select}),
  (dispatch) => bindActionCreators(sourceSelectActions, dispatch)
)(Setup);
