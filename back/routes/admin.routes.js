const { authMiddleware } = require('../middlewares');
const controller = require('../controllers/admin.controller');


module.exports = app => {
  app.get('/admin', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.adminTemplate);
  app.get('/admin/users', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.adminUsersTemplate);
  app.post('/api/admin/update/settings', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.updateSetting);
};
