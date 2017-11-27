import * as os from "os";
import SuperError = require("super-error");
import T from "./translate";

function genericErrorContext(this: {[k: string]: any}) {
  this.ua = [os.platform(), os.release()].join(" ");
  this.locale = T.locale;
}

export const ChampionifyError = SuperError.subclass("ChampionifyError");
export const ElevateError = ChampionifyError.subclass("ElevateError", genericErrorContext);
export const ExternalError = ChampionifyError.subclass("ExternalError", genericErrorContext);
export const FileWriteErrorError = ChampionifyError.subclass("FileWriteError", genericErrorContext);
export const MissingData = ChampionifyError.subclass("MissingData", genericErrorContext);
export const OperationalError = ChampionifyError.subclass("OperationalError", genericErrorContext);
export const ParsingError = ChampionifyError.subclass("ParsingError", genericErrorContext);
export const TranslationError = ChampionifyError.subclass("TranslationError", genericErrorContext);
export const UncaughtException = ChampionifyError.subclass("UncaughtException", genericErrorContext);
export const UpdateError = ChampionifyError.subclass("UpdateError", genericErrorContext);

export const RequestError = SuperError.subclass("RequestError", function(code: string, url: string, body: string) {
  this.code = code;
  this.url = url;
  this.body = body;
  this.ua = [os.platform(), os.release()].join(" ");
  this.locale = T.locale;
});
