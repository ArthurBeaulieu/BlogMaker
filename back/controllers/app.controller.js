const UserHelper = require('../helpers/user.helper');


// Public template, /
exports.publicHomepageTemplate = (req, res) => {
  global.log.info('Request template for the / page');
  UserHelper.isLoggedIn(req).then(isLoggedIn => {
    global.log.info('Rendering template for the / page');
    res.render('partials/index/main', {
      layout : 'index',
      lang: req.locale,
      isLoggedIn: isLoggedIn
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
