import ModalBase from '../ModalBase.js';


class DeleteAccountModal extends ModalBase {


  constructor(options) {
    super(options);
    this._cb = options.cb;
    this._deleteButton = null;
    this._deleteEvtId = -1;
  }


  destroy() {
    super.destroy();
    window.events.removeEvent(this._deleteEvtId);
  }


  _fillAttributes() {
    this._deleteButton = this._modalOverlay.querySelector('#modal-user-delete-button');
    this._events();
  }


  _events() {
    this._deleteEvtId = window.events.addEvent('click', this._deleteButton, this._deleteClicked, this);
  }


  _deleteClicked(event) {
    // Avoid form submit default behavior
    event.preventDefault();
    // Calling the modal url in post allow its resolution
    this.close();
    this._cb();
  }


}


export default DeleteAccountModal;
