const UserHelper = require('../helpers/user.helper');
const RoleHelper = require('../helpers/role.helper');
const ArticleHelper = require('../helpers/article.helper');
const utils = require('../utils/server.utils');


// Private template (for authenticated admin users), /admin
exports.adminTemplate = (req, res) => {
  global.log.info('Rendering template for the /admin page');
  res.render('partials/admin/menu', {
    layout : 'admin',
    lang: req.locale
  });
};


// Private template (for authenticated admin users), /admin/users
exports.adminUsersTemplate = (req, res) => {
  global.log.info('Request template for the /admin/users page');
  // Internal variables for template
  const promises = [];
  const usersFormatted = [];
  // Need to perform user formatting before sending to client
  promises.push(new Promise(resolve => {
    UserHelper.getAll().then(users => {
      RoleHelper.getAll().then(roles => {
        for (let i = 0; i < users.length; ++i) {
          let userRoles = [];
          for (let j = 0; j < roles.length; ++j) {
            userRoles.push({
              id: roles[j]._id,
              name: utils.i18nLocal(req, `admin.users.${roles[j].name}Role`),
              checked: (users[i].roles.indexOf(roles[j]._id) !== -1)
            });
          }
          // Create template user
          const user = {
            id: users[i]._id,
            username: users[i].username,
            email: users[i].email,
            avatar: `/img/avatars/${users[i].avatar}`,
            registration: utils.formatDate(users[i].registration),
            lastLogin: utils.formatDate(users[i].lastlogin),
            isVerified: users[i].active,
            godfather: null,
            depth: users[i].depth,
            children: [],
            roles: userRoles
          };
          // Attach godfather to user
          promises.push(new Promise(resolve => {
            UserHelper.get({ id: users[i].parent }).then(godfather => {
              user.godfather = godfather.username;
            }).finally(() => {
              resolve();
            });
          }));
          // Attach children to user
          promises.push(new Promise(resolve => {
            UserHelper.get({ filter: { _id: { $in: users[i].children } }, multiple: true }).then(children => {
              for (let j = 0; j < children.length; ++j) {
                user.children.push(children[j].username);
              }
            }).finally(() => {
              resolve();
            });
          }));
          // Save user with template formatting
          usersFormatted.push(user);
        }
      }).catch(err => {
        global.log.error(`Unable to retrieve all roles, ${err}`);
      });
    }).catch(err => {
      global.log.error(`Unable to retrieve all users, ${err}`);
    });
    resolve();
  }));
  // On all promises resolution, render template
  Promise.all(promises).then(() => {
    global.log.info('Rendering template for the /admin/users page');
    res.render('partials/admin/users', {
      layout : 'admin',
      users: usersFormatted,
      locked: global.settings.get('lockRegistration'),
      depth: global.settings.get('maxDepth'),
    });
  });
};


// Private template (for authenticated admin users), /admin/articles
exports.adminArticlesTemplate = (req, res) => {
  let page = 0;
  if (req.params.page) {
    page = req.params.page - 1;
  }

  const perPage = 10;
  const currentPage = Math.max(0, page);

  ArticleHelper.get({ perPage: perPage, page: currentPage }).then(opts => {
    const articlesFormatted = [];

    for (let i = 0; i < opts.articles.length; ++i) {
      articlesFormatted.push({
        id: opts.articles[i]._id,
        createdAt: utils.formatDate(opts.articles[i].createdAt),
        published: opts.articles[i].published,
        title: opts.articles[i].title,
        description: opts.articles[i].description,
        content: opts.articles[i].content
      });
    }
    // TODO handle page number way higher than max count
    global.log.info('Rendering template for the /admin/articles page');
    res.render('partials/admin/articles', {
      layout : 'admin',
      articles: articlesFormatted,
      page: currentPage + 1,
      pages: Math.round(opts.total / perPage) || 1
    });
  }).catch(opts => {
    const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
    res.status(responseObject.status).send(responseObject);
  });
};


// Private template (for authenticated admin users), /admin/article/edit
exports.adminEditArticleTemplate = (req, res) => {
  if (req.params.id) {
    ArticleHelper.get({ id: req.params.id }).then(article => {
      global.log.info('Rendering template for the /admin/article/edit page');
      res.render('partials/admin/editarticle', {
        layout : 'admin',
        articleId: article._id,
        articleTitle: article.title,
        articleDescription: article.description,
        articleContent: article.content,
        articlePublished: article.published
      });
    }).catch(opts => {
      const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
      res.status(responseObject.status).send(responseObject);
    });
  } else {
    global.log.info('Rendering template for the /admin/article/edit page');
    res.render('partials/admin/editarticle', {
      layout : 'admin',
      articleId: '',
      articleTitle: '',
      articleDescription: '',
      articleContent: '',
      articlePublished: false
    });
  }
};


// Save an article to the database, /api/admin/article/save
exports.saveArticle = (req, res) => {
  const form = req.body;
  let article = null;
  const promises = [];
  if (!form.id) {
    article = ArticleHelper.new({
      userId: req.userId,
      createdAt: new Date(),
      published: false,
      title: form.title,
      description: form.description,
      content: form.content
    });
  } else {
    promises.push(new Promise((resolve, reject) => {
      ArticleHelper.get({ id: form.id }).then(savedArticle => {
        article = savedArticle;
        article.title = form.title;
        article.description = form.description;
        article.content = form.content;
        resolve();
      }).catch(reject);
    }));
  }

  Promise.all(promises).then(() => {
    ArticleHelper.save(article).then(() => {
      const responseObject = global.log.buildResponseFromCode('B_ARTICLE_SAVE_SUCCESS', { url: '/admin/articles' });
      res.status(responseObject.status).send(responseObject);
    }).catch(opts => {
      const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
      res.status(responseObject.status).send(responseObject);
    });
  }).catch();
};


// Publish an article to the database, /api/admin/article/publish
exports.publishArticle = (req, res) => {
  const form = req.body;
  ArticleHelper.get({ id: form.id }).then(savedArticle => {
    savedArticle.published = form.published;
    ArticleHelper.save(savedArticle).then(() => {
      const responseObject = global.log.buildResponseFromCode('B_ARTICLE_PUBLISHED_SUCCESS', { url: '/admin/articles' });
      res.status(responseObject.status).send(responseObject);
    }).catch(opts => {
      const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
      res.status(responseObject.status).send(responseObject);
    });
  }).catch(opts => {
    const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
    res.status(responseObject.status).send(responseObject);
  });
};


// Update global app setting, /api/admin/update/settings
exports.updateSetting = (req, res) => {
  global.log.info(`Request ${req.method} API call on /api/admin/update/settings`);
  const form = req.body;
  if (form.hasOwnProperty('lockRegistration')) {
    global.log.info(`Set setting lockRegistration to ${form.lockRegistration}`);
    global.settings.set('lockRegistration', form.lockRegistration);
    const responseObject = global.log.buildResponseFromCode('B_ADMIN_SETTING_SET', {}, 'lock registration');
    res.status(responseObject.status).send(responseObject);
  } else if (form.hasOwnProperty('maxDepth')) {
    global.log.info(`Set setting maxDepth to ${form.maxDepth}`);
    const oldDepth = global.settings.get('maxDepth');
    global.settings.set('maxDepth', parseInt(form.maxDepth));
    UserHelper.updateInviteCodes().then(() => {
      const responseObject = global.log.buildResponseFromCode('B_ADMIN_SETTING_SET', {}, 'max depth');
      res.status(responseObject.status).send(responseObject);
    }).catch(opts => {
      global.log.info(`Failed to set setting maxDepth, restoring it to ${oldDepth}`);
      global.settings.set('maxDepth', oldDepth);
      const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
      res.status(responseObject.status).send(responseObject);
    });
  }
};
