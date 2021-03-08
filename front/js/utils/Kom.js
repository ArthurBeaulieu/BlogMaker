import HttpStatusCode from '../utils/enum/HttpStatusCode.js';


class Kom {


  constructor(jwtToken) {
    this._jwtToken = jwtToken || null;
    this._headers = this._createRequestHeaders();
  }


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  -------------------------------------------  CLASS INIT UTILS  -----------------------------------------------  */
  /*  --------------------------------------------------------------------------------------------------------------- */


  /** @method
   * @name _createRequestHeaders
   * @private
   * @memberof Kom
   * @description <blockquote>Fills Kom <code>_headers</code> private member array, to use in HTTP requests later on.
   * This method is required to be called on construction.</blockquote>
   * @return {array[]} - The headers array, length 3, to be used in HTTP requests */
  _createRequestHeaders() {
    return [
      ['Content-Type', 'application/json; charset=UTF-8'],
      ['Accept', 'application/json'],
      ['X-XSRF-TOKEN', this._jwtToken]
    ];
  }


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  -------------------------------------------  PRIVATE METHODS  ------------------------------------------------  */
  /*  --------------------------------------------------------------------------------------------------------------- */


  /** @method
   * @name _getErrorCodeFromHTTPStatus
   * @private
   * @memberof Kom
   * @description <blockquote>This method is called whenever a server request didn't went well. In case a request (from
   * any type) fails, its HTTP status code have to be handle in the method, so it returns an error code can be handled
   * in the user interface (with notification, console or else).</blockquote>
   * @param {number} code - The HTTP status code to handle, in supported ones from HttpStatusCode enumeration
   * @return {string} The HTTP status as an error code */
  _getErrorCodeFromHTTPStatus(code) {
    if (code === HttpStatusCode.NOT_FOUND) {
      return 'B_KOM_NOT_FOUND';
    } else if (code === HttpStatusCode.FORBIDDEN) {
      return 'B_KOM_ACCESS_FORBIDDEN';
    } else if (code === HttpStatusCode.INTERNAL_ERROR) {
      return 'B_KOM_INTERNAL_ERROR';
    } else {
      return `B_KOM_UNKNOWN_ERROR`;
    }
  }


  /** @method
   * @async
   * @name _resolveAs
   * @private
   * @memberof Kom
   * @description <blockquote>Generic tool method used by private methods on fetch responses to format output in the provided
   * format. It must be either `json`, `text` or `raw`.</blockquote>
   * @param {String} type - The type of resolution, can be `json`, `text` or `raw`
   * @param {Object} response - The <code>fetch</code> response object
   * @returns {Promise} The request <code>Promise</code>, format response as an object on resolve, as error code string on reject */
  _resolveAs(type, response) {
    return new Promise((resolve, reject) => {
      if (response) {
        if (type === 'raw') { // Raw are made in XMLHttpRequest and need special handling
          if (response.status === HttpStatusCode.OK) {
            resolve(response.responseText);
          } else {
            reject(this._getErrorCodeFromHTTPStatus(response.status));
          }
        } else if (type === 'json' || type === 'text') { // Call are made using fetch API
          if (response[type]) {
            resolve(response[type]());
          } else { // Fallback on standard error handling
            reject(this._getErrorCodeFromHTTPStatus(response.status));
          }
        } else { // Resolution type doesn't exists
          reject('F_KOM_UNSUPPORTED_TYPE');
        }
      } else {
        reject('F_KOM_MISSING_ARGUMENT');
      }
    });
  }


  /** @method
   * @async
   * @name _resolveAsJSON
   * @private
   * @memberof Kom
   * @description <blockquote>Tool method used by public methods on fetch responses to format output data as JSON to be
   * read in JavaScript code as objects.</blockquote>
   * @param {Object} response - The <code>fetch</code> response object
   * @returns {Promise} The request <code>Promise</code>, format response as an object on resolve, as error code string on reject */
  _resolveAsJSON(response) {
    return this._resolveAs('json', response);
  }


  /** @method
   * @async
   * @name _resolveAsText
   * @private
   * @memberof Kom
   * @description <blockquote>Tool method used by public methods on fetch responses to format output data as text to be
   * read in JavaScript code as string (mostly to parse HTML templates).</blockquote>
   * @param {Object} response - The <code>fetch</code> response object
   * @returns {Promise} The request <code>Promise</code>, format response as a string on resolve, as error code string on reject */
  _resolveAsText(response) {
    return this._resolveAs('text', response);
  }


  /** @method
   * @async
   * @name _resolveAsRaw
   * @private
   * @memberof Kom
   * @description <blockquote>Tool method used by XmlHTTPRequests to format server response as raw binary data.</blockquote>
   * @param {Object} response - The <code>XmlHTTPRequest</code> response status object
   * @returns {Promise} The request <code>Promise</code>, doesn't format response on resolve, send error code string on reject */
  _resolveAsRaw(response) {
    return this._resolveAs('raw', response);
  }


  _xhrCall(url, verb, data) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(verb, url, true);
      xhr.overrideMimeType('text/plain; charset=x-user-defined');
      xhr.onreadystatechange = response => {
        if (response.target.readyState === 4) { // Ready state changed has reach the response state
          this._resolveAsRaw(response.target)
            .then(resolve)
            .catch(reject);
        }
      };
      xhr.onerror = () => {
        reject({ code: 'F_KOM_XHR_ERROR' });
      };
      xhr.send(data);
    });
  }


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  ---------------------------------------  HTTP SERVER CALLS METHODS  ------------------------------------------  */
  /*  --------------------------------------------------------------------------------------------------------------- */


  /** @method
   * @async
   * @name get
   * @public
   * @memberof Kom
   * @description <blockquote><code>GET</code> HTTP request using the fetch API.<br><code>resolve</code> returns the
   * response as an <code>Object</code>.<br><code>reject</code> returns an error key as a <code>String</code>.
   * It is meant to perform API call to access database through the user interface.</blockquote>
   * @param {String} url - The <code>GET</code> url to fetch data from, in supported back URLs
   * @returns {Promise} The request <code>Promise</code> */
  get(url, resolution = this._resolveAsJSON.bind(this)) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        headers: new Headers([this._headers[0]]) // Content type to JSON
      };

      fetch(url, options)
        .then(resolution)
        .then(resolve)
        .catch(reject);
    });
  }


  /** @method
   * @async
   * @name getText
   * @public
   * @memberof Kom
   * @description <blockquote><code>GET</code> HTTP request using the fetch API.<br><code>resolve</code> returns the
   * response as a <code>String</code>.<br><code>reject</code> returns an error key as a <code>String</code>. It is
   * meant to perform API call to get HTML templates as string to be parsed as documents/documents fragments.</blockquote>
   * @param {String} url - The <code>GET</code> url to fetch data from, in supported back URLs
   * @returns {Promise} The request <code>Promise</code> */
  getText(url) {
    return this.get(url, this._resolveAsText.bind(this));
  }


  /** @method
   * @async
   * @name getRaw
   * @public
   * @memberof Kom
   * @description <blockquote><code>GET</code> HTTP request using an <code>XMLHttpRequest</code>, with an override
   * mime type hack to pass bytes through unprocessed.<br><code>resolve</code> returns the response as raw binary data.<br><code>reject</code>
   * returns an error code as a <code>String</code>.</blockquote>
   * @param {String} url - The url to fetch raw data from
   * @returns {Promise} The request <code>Promise</code> */
  getRaw(url) {
    return new Promise((resolve, reject) => {
      this._xhrCall(url, 'GET', null)
        .then(resolve)
        .catch(reject);
    });
  }


  /** @method
   * @async
   * @name post
   * @public
   * @memberof Kom
   * @description <blockquote><code>POST</code> HTTP request using the fetch API.<br>Beware that the given options
   * object match the url expectations.<br><code>resolve</code>
   * returns the response as an <code>Object</code>.<br><code>reject</code> returns an error key as a <code>String</code>.</blockquote>
   * @param {String} url - The <code>POST</code> url to fetch data from
   * @param {Object} data - The <code>JSON</code> object that contains <code>POST</code> parameters
   * @returns {Promise} The request <code>Promise</code> */
  post(url, data, resolution = this._resolveAsJSON.bind(this)) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: new Headers(this._headers), // POST needs all previously defined headers
        body: JSON.stringify(data)
      };

      fetch(url, options)
        .then(resolution)
        .then(resolve)
        .catch(reject);
    });
  }


  /** @method
   * @async
   * @name postText
   * @public
   * @memberof Kom
   * @description <blockquote><code>POST</code> HTTP request using the fetch API.<br>Beware that the given options
   * object match the url expectations.<br><code>resolve</code>
   * returns the response as a <code>String</code>.<br><code>reject</code> returns an error key as a <code>String</code>.</blockquote>
   * @param {String} url - The <code>POST</code> url to fetch data from
   * @param {Object} data - The <code>JSON</code> object that contains <code>POST</code> parameters
   * @returns {Promise} The request <code>Promise</code> */
  postText(url, data) {
    return this.post(url, data, this._resolveAsText.bind(this));
  }


  /** @method
   * @async
   * @name postRaw
   * @public
   * @memberof Kom
   * @description <blockquote><code>POST</code> HTTP request using the fetch API.<br>Beware that the given options
   * object match the url expectations.<br><code>resolve</code>, with an override
   * mime type hack to pass bytes through unprocessed.<br><code>resolve</code> returns the response as raw binary data.<br><code>reject</code>
   * returns an error code as a <code>String</code>.</blockquote>
   * @param {String} url - The url to fetch raw data from
   * @param {Object} data - The <code>JSON</code> object that contains <code>POST</code> parameters
   * @returns {Promise} The request <code>Promise</code> */
  postRaw(url, data) {
    return new Promise((resolve, reject) => {
      this._xhrCall(url, 'POST', JSON.stringify(data))
        .then(resolve)
        .catch(reject);
    });
  }


  postForm(url, data) {
    return new Promise((resolve, reject) => {
      // Create virtual form
      const form = document.createElement('FORM');
      form.method = 'POST';
      form.action = url;
      // Declare its virtual fields from sent data
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const hiddenField = document.createElement('INPUT');
          hiddenField.type = 'hidden';
          hiddenField.name = key;
          hiddenField.value = data[key];
          form.appendChild(hiddenField);
        }
      }
      // Build XHR with xsrf token
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      //xhr.setRequestHeader('X-XSRF-TOKEN', this._csrfToken);
      // Register the state change event
      xhr.onreadystatechange = response => {
        if (response.target.readyState === 4) { // Ready state changed has reach the response state
          // As specified with backend, response is JSON if success, HTML otherwise
          try {
            // If we can parse as a JSON, everything went fine server side
            const output = JSON.parse(response.target.response);
            resolve(output);
          } catch (err) {
            // Otherwise, the server returns the template with its errors
            reject(response.target.response);
          }
        }
      };
      // XHR error handling
      xhr.onerror = () => {
        reject('F_KOM_XHR_ERROR');
      };
      // Create form data and send it through the XHR
      const formData = new FormData(form);
      xhr.send(formData);
    });
  }


  xhr(verb, url, data) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(verb, url, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          resolve(JSON.parse(xhr.responseText));
        }
      };
      // XHR error handling
      xhr.onerror = () => { reject({ code: 'F_KOM_XHR_ERROR' }); };
      xhr.send(data);
    });
  }


  get jwtToken() {
    return this._jwtToken;
  }


  set jwtToken(token) {
    this._jwtToken = token;
  }


}


export default Kom;
