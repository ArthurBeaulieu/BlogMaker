const { authMiddleware, userMiddleware } = require('../middlewares');
const controller = require('../controllers/user.controller');


module.exports = app => {
  app.get('/profile', [authMiddleware.isLoggedIn, authMiddleware.isActivated], controller.profileTemplate);
  app.get('/profile/edit', [authMiddleware.isLoggedIn, authMiddleware.isActivated], controller.profileEditTemplate);
  app.get('/api/user/delete', [authMiddleware.isLoggedIn, authMiddleware.isActivated], controller.delete); // User want to remove its account
  app.post('/api/user/delete', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.delete); // Admin remove user account
  app.post('/api/user/update/info', [authMiddleware.isLoggedIn, authMiddleware.isActivated], controller.updateInfo);
  app.post('/api/user/update/role', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.updateRole);
  app.post('/api/user/update/password', [authMiddleware.isLoggedIn, authMiddleware.isActivated], controller.updatePassword);
  app.post('/api/user/update/avatar', [authMiddleware.isLoggedIn, authMiddleware.isActivated], controller.updateAvatar);
  app.post('/api/user/delete/avatar', [authMiddleware.isLoggedIn, authMiddleware.isActivated], controller.deleteAvatar);
  app.post('/api/user/upload/avatar', [authMiddleware.isLoggedIn, authMiddleware.isActivated, userMiddleware.uploadAvatar], controller.uploadAvatar);
};
