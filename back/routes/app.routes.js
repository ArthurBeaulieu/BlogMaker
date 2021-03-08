const { authMiddleware } = require('../middlewares');
const controller = require('../controllers/app.controller');


module.exports = app => {
  app.get('/', controller.publicHomepageTemplate);
  app.get('/home', [authMiddleware.isLoggedIn, authMiddleware.isActivated], controller.homepageTemplate);
};
