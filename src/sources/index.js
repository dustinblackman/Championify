import glob from 'glob';
import path from 'path';
import R from 'ramda';


const source_names = [];
const sources = {};

R.forEach(source_path => {
  const source = require(source_path);

  // Temp workaround to avoid broken tests
  if (!source.source_info) source.source_info = {};

  sources[source.source_info.id] = source;
  source_names.push(source.source_info);
}, glob.sync(path.join(__dirname, './*(!(index.js))')));

export default sources;
export const sources_info = R.sortBy(R.prop('name'), source_names);
