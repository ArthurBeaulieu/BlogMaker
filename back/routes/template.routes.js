const { authMiddleware } = require('../middlewares');
const controller = require('../controllers/template.controller');


module.exports = app => {
  app.get('/template/modal/delete/user', [authMiddleware.isLoggedIn, authMiddleware.isActivated], controller.deleteUserModal);
};
