class ModalBase {


  constructor(options) {
    this._url = options.url;
    this._modalOverlay = null;
    this._overlayClickedEvtId = -1;
    this._closeButtons = null;
    this._closeClickedEvtIds = [];
    // Modal building sequence:
    // - get HTML template from server;
    // - parse template response to become DOM object;
    // - append DOM element to global overlay;
    // - open modal by adding overlay to the body;
    // - let child class fill attributes and register its events.
    this._loadTemplate();
  }


  destroy() {
    // Must be overridden in child class to clean extension properties and events
    window.events.removeEvent(this._overlayClickedEvtId); // Might do nothing, as event is removed in close method
    for (let i = 0; i < this._closeButtons.length; ++i) {
      window.events.removeEvent(this._closeClickedEvtIds[i]);
    }
     // Same for this event
    delete this._url;
    delete this._modalOverlay;
    delete this._overlayClickedEvtId;
    delete this._closeButtons;
    delete this._closeClickedEvtIds;
  }



  _loadTemplate() {
    window.kom.getText(this._url).then(response => {
      this._modalOverlay = this.parseHTMLFragment(response);
      // Get close button from template
      this._closeButtons = this._modalOverlay.querySelectorAll('.modal-close');
      this.open();
      this._fillAttributes();
    }).catch(error => {
      console.error(error);
    });
  }


  _fillAttributes() {
    // Must be overridden in child class to build modal with HTML template attributes
  }


  parseHTMLFragment(htmlString) {
    const parser = new DOMParser();
    const dom = parser.parseFromString(htmlString, 'text/html');
    return dom.body.firstChild;
  }


  open() {
    document.body.appendChild(this._modalOverlay);
    this._overlayClickedEvtId = window.events.addEvent('click', this._modalOverlay, this.close, this);
    for (let i = 0; i < this._closeButtons.length; ++i) {
      this._closeClickedEvtIds.push(window.events.addEvent('click', this._closeButtons[i], this.close, this));
    }
  }


  close(event) {
    // Must be overridden in child class to properly clean extension properties and events
    for (let i = 0; i < this._closeButtons.length; ++i) {
      if (!event || (event && (event.target === this._modalOverlay || event.target === this._closeButtons[i]))) {
        // Remove the overlay from the body
        document.body.removeChild(this._modalOverlay);
        // Use the child class destroy
        this.destroy();
        return;
      }
    }
  }


}


export default ModalBase;
