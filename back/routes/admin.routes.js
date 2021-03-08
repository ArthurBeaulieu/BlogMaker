const { authMiddleware } = require('../middlewares');
const controller = require('../controllers/admin.controller');


module.exports = app => {
  app.get('/admin', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.adminTemplate);
  app.get('/admin/users', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.adminUsersTemplate);
  app.get('/admin/articles', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.adminArticlesTemplate);
  app.get('/admin/articles/:page', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.adminArticlesTemplate);
  app.get('/admin/article/edit', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.adminEditArticleTemplate);
  app.get('/admin/article/edit/:id', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.adminEditArticleTemplate);
  app.post('/api/admin/article/save', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.saveArticle);
  app.post('/api/admin/article/publish', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.publishArticle);
  app.post('/api/admin/update/settings', [authMiddleware.isLoggedIn, authMiddleware.isActivated, authMiddleware.isAdmin], controller.updateSetting);
};
