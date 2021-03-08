import '../scss/Index.scss';


class Index {


  constructor() {
    this._init();
  }


  _init() {
    console.log('Welcome to UserStack');
  }


}


window.app = new Index();
export default Index;
