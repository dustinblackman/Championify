import Bluebird = require("bluebird");
import chokidar = require("chokidar");
import fs = require("fs-extra");
import sass = require("node-sass");
import * as path from "path";
import DTSCreator = require("typed-css-modules");

const creator = new DTSCreator();

function deleteDeclaration(file_path: string) {
  const declaration_path = `${file_path}.d.ts`;
  if (fs.existsSync(declaration_path)) {
    fs.removeSync(declaration_path);
  }
}

async function process(file_path: string) {
  // TODO: May not need to convert to css first.
  const { css } = await Bluebird.fromCallback(cb => sass.render({file: file_path}, cb));
  if (css.length === 0) return deleteDeclaration(file_path);
  const { formatted } = await creator.create(file_path, css.toString());
  if (formatted.length === 0) return deleteDeclaration(file_path);
  fs.writeFileSync(`${file_path}.d.ts`, formatted, "utf8");
}

async function run() {
  const watcher = chokidar.watch(path.join(__dirname, "../app/**/*.scss"));
  console.log("Watching SCSS");

  watcher.on("add", file_path => {
    console.log("SCSS Added", file_path);
    process(file_path).catch(err => console.log(err));
  });

  watcher.on("change", file_path => {
    console.log("SCSS Changed", file_path);
    process(file_path).catch(err => console.log(err));
  });

  watcher.on("unlink", file_path => {
    console.log("SCSS Deleted", file_path);
    deleteDeclaration(file_path);
  });
}

run().catch(err => console.log(err));
