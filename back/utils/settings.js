const fs = require('fs');
const path = require('path');


/* Class to make global server settings available, and to save them into associated JSON */


class settings {


  constructor() {
    this._settings = require('./json/settings.json');
  }


  get(setting) {
    if (this._settings.hasOwnProperty(setting)) {
      return this._settings[setting];
    } else {
      return null;
    }
  }


  set(setting, value) {
    if (this._settings.hasOwnProperty(setting)) {
      this._settings[setting] = value;
      fs.writeFileSync(`${path.dirname(require.main.filename)}/utils/json/settings.json`, JSON.stringify(this._settings, null, 2));
    }
  }

}


module.exports = settings;