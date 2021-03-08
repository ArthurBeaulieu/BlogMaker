import DeleteAccountModal from './controller/DeleteAccountModal.js';


const Classes = {
  DeleteAccountModal
};


class ModalFactory {


  constructor(name, options = {}) {
    return new Classes[`${name}Modal`](options);
  }


}


export default ModalFactory;