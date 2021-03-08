const fs = require('fs');
const path = require('path');
const i18n = require('i18n'); // Build response messages using i18n errors
const text = require('./json/logger.json'); // Server console logging messages in english, no need for i18n
const utils = require('./server.utils');


/* Backend logger class to properly handle both the logging files and the response to send to the client */


class logger {


  constructor(options) {
    const d = new Date();
    this._debug = options.debug;
    this._date = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
    this._logFile = null;
    this._prepareFileLogging();
  }


  _prepareFileLogging() {
    const filePath = `${path.dirname(require.main.filename)}/log/Log-${this._date}.log`;
    if (!fs.existsSync(filePath)) {
      // Create folder
      if (!fs.existsSync(`${path.dirname(require.main.filename)}/log/`)) {
        fs.mkdirSync(`${path.dirname(require.main.filename)}/log/`, { recursive: true });
      }
      // Create file
      fs.writeFileSync(filePath, '');
    }
    // Saved file path
    this._logFile = filePath;
  }


  raise(options) {
    const d = new Date();
    const date = utils.formatDate();
    const output = `[${options.type.toUpperCase()}] ${date} : ${options.message}`;
    if (this._debug) {
      let color = '\x1b[0m';
      if (options.type === 'error') {
        color = '\x1b[31m';
      } else if (options.type === 'warn') {
        color = '\x1b[33m';
      }
      console[options.type](`${color}%s\x1b[0m`, output);
    }
    // Day changed, creating new log file
    const logDate = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
    if (this._date !== logDate) {
      this._date = logDate;
      this._logFile = `${path.dirname(require.main.filename)}/log/Log-${this._date}.log`;
    }
    this._prepareFileLogging();
    // Dump raised issue into log file
    fs.appendFile(this._logFile, `${output}\n`, () => {});
  }


  error(message) {
    this.raise({
      type: 'error',
      message: message
    });
  }


  warn(message) {
    this.raise({
      type: 'warn',
      message: message
    });
  }


  info(message) {
    this.raise({
      type: 'log',
      message: message
    })
  }


  logFromCode(code, msg = '') {
    if (text[code]) {
      const additionalMsg = (msg) ? ` : ${msg}` : '';
      this[text[code].type](text[code].log + additionalMsg);
    }
  }


  buildResponseFromCode(code, opts = {}, msg) {
    if (text[code]) {
      this.logFromCode(code, msg);
      return Object.assign({
        code: code,
        status: text[code].status,
        message: i18n.__(`errors.${code}`, msg)
      }, opts);
    }
  }


}


module.exports = logger;