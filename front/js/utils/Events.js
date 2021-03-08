class Events {


  constructor(debug = false) {
    // Prevent wrong type for debug
    if (typeof debug !== 'boolean') {
      debug = false;
    }
    this._debug = debug;
    this._idIncrementor = (Math.floor(Math.random() * Math.floor(256)) * 5678);
    this._regularEvents = [];
    this._customEvents = {};
    this.version = '1.2.1';
  }


  destroy() {
    // Debug logging
    this._raise('log', 'CustomEvents.destroy');
    // Remove all existing eventListener
    this.removeAllEvents();
    // Delete object attributes
    Object.keys(this).forEach(key => {
      delete this[key];
    });
  }


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  --------------------------------------  CLASSIC JS EVENTS OVERRIDE  ------------------------------------------  */
  /*                                                                                                                  */
  /*  The following methods are made to abstract the event listeners from the JavaScript layer, so you can easily     */
  /*  remove them when done using, without bothering with binding usual business for them. 'addEvent/removeEvent'     */
  /*  method replace the initial ones. 'removeAllEvents' clears all instance event listeners ; nice for destroy       */
  /*  --------------------------------------------------------------------------------------------------------------- */


  addEvent(eventName, element, callback, scope = element, options = false) {
    // Debug logging
    this._raise('log', `CustomEvents.addEvent: ${eventName} ${element} ${callback} ${scope} ${options}`);
    // Missing mandatory arguments
    if (eventName === null || eventName === undefined ||
      element === null || element === undefined ||
      callback === null || callback === undefined) {
      this._raise('error', 'CustomEvents.addEvent: Missing mandatory arguments');
      return false;
    }
    // Prevent wrong type for arguments (mandatory and optional)
    const err = () => {
      this._raise('error', 'CustomEvents.addEvent: Wrong type for argument');
    };
    // Test argument validity for further process
    if (typeof eventName !== 'string' || typeof element !== 'object' || typeof callback !== 'function') {
      err();
      return false;
    }
    if ((scope !== null && scope !== undefined) && typeof scope !== 'object') {
      err();
      return false;
    }
    if ((options !== null && options !== undefined) && (typeof options !== 'object' && typeof options !== 'boolean')) {
      err();
      return false;
    }
    // Save scope to callback function, default scope is DOM target object
    callback = callback.bind(scope);
    // Add event to internal array and keep all its data
    this._regularEvents.push({
      id: this._idIncrementor,
      element: element,
      eventName: eventName,
      scope: scope,
      callback: callback,
      options: options
    });
    // Add event listener with options
    element.addEventListener(eventName, callback, options);
    // Post increment to return the true event entry id, then update the incrementer
    return this._idIncrementor++;
  }


  removeEvent(eventId) {
    // Debug logging
    this._raise('log', `Events.removeEvent: ${eventId}`);
    // Missing mandatory arguments
    if (eventId === null || eventId === undefined) {
      this._raise('error', 'CustomEvents.removeEvent: Missing mandatory arguments');
      return false;
    }
    // Prevent wrong type for arguments (mandatory)
    if (typeof eventId !== 'number') {
      this._raise('error', 'CustomEvents.removeEvent: Wrong type for argument');
      return false;
    }
    // Returned value
    let statusCode = false; // Not found status code by default (false)
    // Iterate over saved listeners, reverse order for proper splicing
    for (let i = (this._regularEvents.length - 1); i >= 0 ; --i) {
      // If an event ID match in saved ones, we remove it and update saved listeners
      if (this._regularEvents[i].id === eventId) {
        // Update status code
        statusCode = true; // Found and removed event listener status code (true)
        this._clearRegularEvent(i);
      }
    }
    // Return with status code
    return statusCode;
  }


  removeAllEvents() {
    // Debug logging
    this._raise('log', 'CustomEvents.removeAllEvents');
    // Returned value
    let statusCode = false; // Didn't removed any status code by default (false)
    // Flag to know if there was any previously stored event listeners
    const hadEvents = (this._regularEvents.length > 0);
    // Iterate over saved listeners, reverse order for proper splicing
    for (let i = (this._regularEvents.length - 1); i >= 0; --i) {
      this._clearRegularEvent(i);
    }
    // If all events where removed, update statusCode to success
    if (this._regularEvents.length === 0 && hadEvents) {
      // Update status code
      statusCode = true; // Found and removed all events listener status code (true)
    }
    // Return with status code
    return statusCode;
  }


  _clearRegularEvent(index) {
    // Debug logging
    this._raise('log', `CustomEvents._clearRegularEvent: ${index}`);
    // Missing mandatory arguments
    if (index === null || index === undefined) {
      this._raise('error', 'CustomEvents._clearRegularEvent: Missing mandatory argument');
      return false;
    }
    // Prevent wrong type for arguments (mandatory)
    if (typeof index !== 'number') {
      this._raise('error', 'CustomEvents._clearRegularEvent: Wrong type for argument');
      return false;
    }
    // Check if index match an existing event in attributes
    if (this._regularEvents[index]) {
      // Remove its event listener and update regularEvents array
      const evt = this._regularEvents[index];
      evt.element.removeEventListener(evt.eventName, evt.callback, evt.options);
      this._regularEvents.splice(index, 1);
      return true;
    }

    return false;
  }


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  -------------------------------------------  CUSTOM JS EVENTS  -----------------------------------------------  */
  /*                                                                                                                  */
  /*  The three following methods (subscribe, unsubscribe, publish) are designed to reference an event by its name    */
  /*  and handle as many subscriptions as you want. When subscribing, you get an ID you can use to unsubscribe your   */
  /*  event later. Just publish with the event name to callback all its registered subscriptions.                     */
  /*  --------------------------------------------------------------------------------------------------------------- */


  subscribe(eventName, callback, oneShot = false) {
    // Debug logging
    this._raise('log', `CustomEvents.subscribe: ${eventName} ${callback} ${oneShot}`);
    // Missing mandatory arguments
    if (eventName === null || eventName === undefined ||
      callback === null || callback === undefined) {
      this._raise('error', 'CustomEvents.subscribe', 'Missing mandatory arguments');
      return false;
    }
    // Prevent wrong type for arguments (mandatory and optional)
    const err = () => {
      this._raise('error', 'CustomEvents.subscribe: Wrong type for argument');
    };
    if (typeof eventName !== 'string' || typeof callback !== 'function') {
      err();
      return false;
    }
    if ((oneShot !== null && oneShot !== undefined) && typeof oneShot !== 'boolean') {
      err();
      return false;
    }
    // Create event entry if not already existing in the registered events
    if (!this._customEvents[eventName]) {
      this._customEvents[eventName] = []; // Set empty array for new event subscriptions
    }
    // Push new subscription for event name
    this._customEvents[eventName].push({
      id: this._idIncrementor,
      name: eventName,
      os: oneShot,
      callback: callback
    });
    // Post increment to return the true event entry id, then update the incrementer
    return this._idIncrementor++;
  }


  unsubscribe(eventId) {
    // Debug logging
    this._raise('log', `CustomEvents.unsubscribe: ${eventId}`);
    // Missing mandatory arguments
    if (eventId === null || eventId === undefined) {
      this._raise('error', 'CustomEvents.unsubscribe: Missing mandatory arguments');
      return false;
    }
    // Prevent wrong type for arguments (mandatory)
    if (typeof eventId !== 'number') {
      this._raise('error', 'CustomEvents.unsubscribe: Wrong type for argument');
      return false;
    }
    // Returned value
    let statusCode = false; // Not found status code by default (false)
    // Save event keys to iterate properly on this._events Object
    const keys = Object.keys(this._customEvents);
    // Reverse events iteration to properly splice without messing with iteration order
    for (let i = (keys.length - 1); i >= 0; --i) {
      // Get event subscriptions
      const subs = this._customEvents[keys[i]];
      // Iterate over events subscriptions to find the one with given id
      for (let j = 0; j < subs.length; ++j) {
        // In case we got a subscription for this events
        if (subs[j].id === eventId) {
          // Debug logging
          this._raise('log', `CustomEvents.unsubscribe: subscription found\n`, subs[j], `\nSubscription n°${eventId} for ${subs.name} has been removed`);
          // Update status code
          statusCode = true; // Found and unsubscribed status code (true)
          // Remove subscription from event Array
          subs.splice(j, 1);
          // Remove event name if no remaining subscriptions
          if (subs.length === 0) {
            delete this._customEvents[keys[i]];
          }
          // Break since id are unique and no other subscription can be found after
          break;
        }
      }
    }
    // Return with status code
    return statusCode;
  }


  unsubscribeAllFor(eventName) {
    // Debug logging
    this._raise('log', `CustomEvents.unsubscribeAllFor: ${eventName}`);
    // Missing mandatory arguments
    if (eventName === null || eventName === undefined) {
      this._raise('error', 'CustomEvents.unsubscribeAllFor: Missing mandatory arguments');
      return false;
    }
    // Prevent wrong type for arguments (mandatory and optional)
    if (typeof eventName !== 'string') {
      this._raise('error', 'CustomEvents.unsubscribeAllFor: Wrong type for argument');
      return false;
    }
    // Returned value
    let statusCode = false; // Not found status code by default (false)
    // Save event keys to iterate properly on this._events Object
    const keys = Object.keys(this._customEvents);
    // Iterate through custom event keys to find matching event to remove
    for (let i = 0; i < keys.length; ++i) {
      if (keys[i] === eventName) {
        // Get event subscriptions
        const subs = this._customEvents[keys[i]];
        // Iterate over events subscriptions to find the one with given id, reverse iteration to properly splice without messing with iteration order
        for (let j = (subs.length - 1); j >= 0; --j) {
          // Update status code
          statusCode = true; // Found and unsubscribed all status code (true)
          // Remove subscription from event Array
          subs.splice(j, 1);
          // Remove event name if no remaining subscriptions
          if (subs.length === 0) {
            delete this._customEvents[keys[i]];
          }
        }
      }
    }
    // Return with status code
    return statusCode;
  }


  publish(eventName, data = null) {
    // Debug logging
    this._raise('log', `CustomEvents.publish: ${eventName} ${data}`);
    // Missing mandatory arguments
    if (eventName === null || eventName === undefined) {
      this._raise('error', 'CustomEvents.publish: Missing mandatory arguments');
      return false;
    }
    // Prevent wrong type for arguments (mandatory and optional)
    if (typeof eventName !== 'string' || (data !== undefined && typeof data !== 'object')) {
      this._raise('error', 'CustomEvents.publish: Wrong type for argument');
      return false;
    }
    // Returned value
    let statusCode = false; // Not found status code by default (false)
    // Save event keys to iterate properly on this._events Object
    const keys = Object.keys(this._customEvents);
    // Iterate over saved custom events
    for (let i = 0; i < keys.length; ++i) {
      // If published name match an existing events, we iterate its subscriptions. First subscribed, first served
      if (keys[i] === eventName) {
        // Update status code
        statusCode = true; // Found and published status code (true)
        // Get event subscriptions
        const subs = this._customEvents[keys[i]];
        // Iterate over events subscriptions to find the one with given id
        // Reverse subscriptions iteration to properly splice without messing with iteration order
        for (let j = (subs.length - 1); j >= 0; --j) {
          // Debug logging
          this._raise('log', `CustomEvents.publish: fire callback for ${eventName}, subscription n°${subs[j].id}`, subs[j]);
          // Fire saved callback
          subs[j].callback(data);
          // Remove oneShot listener from event entry
          if (subs[j].os) {
            // Debug logging
            this._raise('log', 'CustomEvents.publish: remove subscription because one shot usage is done');
            subs.splice(j, 1);
            // Remove event name if no remaining subscriptions
            if (subs.length === 0) {
              delete this._customEvents[keys[i]];
            }
          }
        }
      }
    }
    // Return with status code
    return statusCode;
  }


  /*  --------------------------------------------------------------------------------------------------------------- */
  /*  --------------------------------------------  COMPONENT UTILS  -----------------------------------------------  */
  /*  --------------------------------------------------------------------------------------------------------------- */


  _raise(level, errorValue) {
    if (this._debug) {
      console[level](errorValue);
    }
  }


}


export default Events;
