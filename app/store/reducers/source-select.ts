const CHANGE_ARAM = "source_select/change_aram";
const CHANGE_SUMMONERS = "source_select/change_summoners";

export interface SourceSelectActionObject {
  type: string;
  data: {
    name: string;
    active: boolean;
  };
}

export interface SourceSelectState {
  aram: {[k: string]: boolean};
  summoners: {[k: string]: boolean};
}

export const default_state: SourceSelectState = {
  aram: {},
  summoners: {}
};

export const sourceSelectActions = {
  changeAram: (name: string, active: boolean) => ({type: CHANGE_ARAM, data: {name, active}}),
  changeSummoners: (name: string, active: boolean) => ({type: CHANGE_SUMMONERS, data: {name, active}})
};

export type SourceSelectProps = {sources: SourceSelectState} & typeof sourceSelectActions;

export default function sourceSelect(state: SourceSelectState = default_state, action: SourceSelectActionObject): SourceSelectState {
  switch (action.type) {
    case CHANGE_ARAM:
      return {...state, aram: {...state.aram, [action.data.name]: action.data.active}};
    case CHANGE_SUMMONERS:
      return {...state, summoners: {...state.summoners, [action.data.name]: action.data.active}};
    default:
      return state;
  }
}
