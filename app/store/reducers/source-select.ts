const CHANGE_SOURCES = "source_select/change";

export interface SourceSelectOption {
  label: string;
  value: string;
}

export interface SourceSelectActionObject {
  type: string;
  data: SourceSelectOption[];
}

export interface SourceSelectState {
  sources: SourceSelectOption[];
}

export const default_state: SourceSelectState = {
  sources: []
};

export const sourceSelectActions = {
  changeSources: (data: SourceSelectOption[]) => ({type: CHANGE_SOURCES, data})
};

export type SourceSelectProps = SourceSelectState & typeof sourceSelectActions;

export default function sourceSelect(state: SourceSelectState = default_state, action: SourceSelectActionObject): SourceSelectState {
  switch (action.type) {
    case CHANGE_SOURCES:
      return {sources: action.data};
    default:
      return state;
  }
}
