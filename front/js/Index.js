import '../scss/Index.scss';


class Index {


  constructor() {
    this._init();
  }


  _init() {
    console.log('Welcome to BlogMaker');
  }


}


window.app = new Index();
export default Index;
