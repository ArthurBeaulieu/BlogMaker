const UserHelper = require('../helpers/user.helper');
const ArticleHelper = require('../helpers/article.helper');


// Public template, /
exports.publicHomepageTemplate = (req, res) => {
  global.log.info('Request template for the / page');
  UserHelper.isLoggedIn(req).then(isLoggedIn => {

    const perPage = 10;
    const currentPage = Math.max(0, 0);

    ArticleHelper.get({ filter: { published: true }, perPage: perPage, page: currentPage }).then(opts => {
      const articlesFormatted = [];

      for (let i = 0; i < opts.articles.length; ++i) {
        articlesFormatted.push({
          id: opts.articles[i]._id,
          createdAt: opts.articles[i].createdAt,
          published: opts.articles[i].published,
          title: opts.articles[i].title,
          description: opts.articles[i].description,
          content: opts.articles[i].content
        });
      }
      // TODO handle page number way higher than max count
      global.log.info('Rendering template for the / page');
      res.render('partials/index/main', {
        layout : 'index',
        lang: req.locale,
        isLoggedIn: isLoggedIn,
        articles: articlesFormatted,
        page: currentPage + 1,
        pages: Math.round(opts.total / perPage) || 1
      });
    }).catch(opts => {
      const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
      res.status(responseObject.status).send(responseObject);
    });
  });
};


// Private template (for authenticated users), /home
exports.homepageTemplate = (req, res) => {
  global.log.info('Request template for the /home page');
  UserHelper.get({ id: req.userId }).then(user => {
    global.log.info(`Matching user ${user.username} to display the homepage`);
    UserHelper.isAdminUser(user).then(isAdminUser => {
      global.log.info('Rendering template for the /home page');
      res.render('partials/home/main', {
        layout : 'home',
        lang: req.locale,
        isAdmin: isAdminUser
      });
    }).catch(opts => {
      global.log.buildResponseFromCode(opts.code, {}, opts.err);
      res.redirect(302, '/');
    });
  }).catch(opts => {
    global.log.buildResponseFromCode(opts.code, {}, opts.err);
    res.redirect(302, '/');
  });
};
