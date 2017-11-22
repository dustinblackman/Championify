import Bluebird = require("bluebird");
import * as path from "path";
import R = require("ramda");
import semver = require("semver");
// import $ from "./helpers/jquery";

import * as ChampionifyErrors from "./errors";
import Log from "./logger";
import pathManager from "./path_manager";
import store from "./store";
import T from "./translate";

const fs = Bluebird.promisifyAll(require("fs-extra"));
const pkg = require("../package.json");

interface PreferenceOptions {
  prefs_version: string;
  locale: string;
  install_path: string;
  champ_path: string;
  local_is_version: string;
  options: {
    splititems: boolean;
    skillsformat: boolean;
    consumables: boolean;
    consumables_position: boolean;
    trinkets: boolean;
    trinkets_position: boolean;
    locksr: boolean;
    sr_source: string[];
    dontdeleteold: boolean;
    aram: boolean;
  };
}

class Preferences {
  /** Get preference directory */
  directory() {
    if (process.platform === "darwin") {
      return path.join(process.env.HOME as string, "Library/Application Support/Championify/");
    }

    return path.join(process.env.APPDATA as string, "Championify");
  }

  /** Get preference file path */
  file() {
    return path.join(this.directory(), "prefs.json");
  }

  /** Gets preferences file */
  load(): PreferenceOptions | null {
    const preference_file = this.file();
    if (fs.existsSync(preference_file)) {
      let prefs: PreferenceOptions | null = null;
      const rawprefs = fs.readFileSync(preference_file);
      try {
        prefs = JSON.parse(rawprefs);
      } catch (err) {
        Log.warn("Unable to parse preferences");
        Log.warn(rawprefs);
        Log.warn(err);
      }

      if (!prefs || !prefs.prefs_version || semver.lt(prefs.prefs_version, "1.3.3")) return null;
      return prefs;
    }

    return null;
  }

  /**
   * Applies preferences to UI
   * @param {Object} Preferences object
   */

  set(preferences: PreferenceOptions) {
    if (!preferences) return pathManager.findInstallPath();

    $("#local_version").text(preferences.local_is_version || T.t("unknown"));
    pathManager.checkInstallPath(preferences.install_path, function(err: Error) {
      if (err) {
        pathManager.findInstallPath();
      } else {
        pathManager.checkInstallPath(preferences.install_path, pathManager.setInstallPath);
      }
    });

    // There's a better ramda function for this somewhere...
    R.forEach(entry => {
      const key = entry[0];
      const val = entry[1];

      if (key.indexOf("position") > -1) {
        $(`#options_${key}`).find(`.${val}`).addClass("active selected");
      } else {
        $(`#options_${key}`).prop("checked", val);
      }
    }, R.toPairs(preferences.options));
  }

  /**
   * Gets all preferences from UI
   * @returns {Object} Preferences object
   */

  get(): PreferenceOptions {
    const consumables_position = $("#options_consumables_position").find(".beginning").hasClass("selected") ? "beginning" : "end";
    const trinkets_position = $("#options_trinkets_position").find(".beginning").hasClass("selected") ? "beginning" : "end";

    return {
      prefs_version: pkg.version,
      locale: T.locale,
      install_path: store.get("lol_install_path"),
      champ_path: store.get("lol_champ_path"),
      local_is_version: $("#local_version").text(),
      options: {
        splititems: $("#options_splititems").is(":checked"),
        skillsformat: $("#options_skillsformat").is(":checked"),
        consumables: $("#options_consumables").is(":checked"),
        consumables_position: consumables_position,
        trinkets: $("#options_trinkets").is(":checked"),
        trinkets_position: trinkets_position,
        locksr: $("#options_locksr").is(":checked"),
        sr_source: ($("#options_sr_source").val() as string).split(","),
        dontdeleteold: $("#options_dontdeleteold").is(":checked"),
        aram: $("#options_aram").is(":checked")
      }
    };
  }

  /**
   * Saves preference file
   * @param {Object} [this.get()] Preferences object
   * @returns {Promise}
   */

  save(preferences: PreferenceOptions) {
    preferences = preferences || this.get();
    if (!preferences) throw new ChampionifyErrors.OperationalError("Preferences object does not exist");
    const preference_file = this.file();
    fs.mkdirsSync(this.directory());
    return fs.writeFileAsync(preference_file, JSON.stringify(preferences, null, 2), "utf8")
      .tap(() => Log.info(`Saved preference file to ${preference_file}`))
      .catch((err: Error) => Log.error(err));
  }
}

const prefs = new Preferences();
export default prefs;
