import R = require("ramda");
import { combineReducers, ReducersMapObject } from "redux";

import * as source_select from "./source-select";

// Holds all the states types for the entire project which is passed in when using connect from react-redux.
export interface ReducersState {
  source_select: typeof source_select.default_state;
}

// TODO Replace any.
function mapReducerFunctions(reducers: any): ReducersMapObject {
  return R.zipObj(R.keys(reducers), R.pluck("default", R.values(reducers)));
}

const reducers = combineReducers(mapReducerFunctions({
  source_select
}));

export default reducers;
