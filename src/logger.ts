import * as path from "path";
import winston = require("winston");
import ElectronConsole = require("winston-electron");

import preferences from "./preferences";

const Log = new winston.Logger({
  transports: [
    new ElectronConsole({
      level: process.env.NODE_ENV === "test" ? "emerg" : "debug",
      handleExceptions: true
    }),
    new winston.transports.File({
      filename: path.join(preferences.directory(), "championify.log.txt"),
      json: true,
      handleExceptions: true,
      prettyPrint: true,
      level: process.env.NODE_ENV === "test" ? "emerg" : "debug",
      options: {flags: "w"}
    })
  ]
});

export default Log;
