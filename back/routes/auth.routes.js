const { authMiddleware } = require('../middlewares');
const controller = require('../controllers/auth.controller');


module.exports = app => {
  app.get('/login', controller.loginTemplate);
  app.get('/register', [authMiddleware.isRegistrationAllowed], controller.registerTemplate);
  app.get('/register/activate', [authMiddleware.isLoggedIn, authMiddleware.isNotActivated], controller.registerActivateTemplate)
  app.get('/verify/:email/:token', controller.verify);
  app.get('/logout', [authMiddleware.isLoggedIn], controller.logout);
  app.post('/api/auth/login', controller.loginPost);
  app.post('/api/auth/register', [authMiddleware.isRegistrationAllowed, authMiddleware.checkDuplicateUsernameOrEmail], controller.registerPost);
};
