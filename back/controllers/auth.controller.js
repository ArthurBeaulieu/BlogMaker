const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const authConfig = require('../config/auth.config');
const mailConfig = require('../config/mail.config');
const UserHelper = require('../helpers/user.helper');
const RoleHelper = require('../helpers/role.helper');
const AuthTokenHelper = require('../helpers/authtoken.helper');
const FormHelper = require('../helpers/form.helper');
const MailHelper = require('../helpers/mail.helper');
const identicon = require('../utils/identicon');
const utils = require('../utils/server.utils');


// Check sent password and compare with matching user to authorize login or not
const _finalizeLogin = opts => {
  // Password not matching the user
  if (!bcrypt.compareSync(opts.form.password, opts.user.password)) {
    const responseObject = global.log.buildResponseFromCode('B_LOGIN_INVALID_PASSWORD', {}, opts.form.username);
    opts.res.status(responseObject.status).send(responseObject);
    return;
  }
  // Check if user is activated
  if (!opts.user.active) {
    const responseObject = global.log.buildResponseFromCode('B_LOGIN_USER_NOT_ACTIVE', {}, opts.form.username);
    opts.res.status(responseObject.status).send(responseObject);
    return;
  }
  // Update user last login and save it to the database
  opts.user.lastlogin = new Date();
  global.log.info(`Saving new last login for ${opts.form.username} in database`);
  UserHelper.save(opts.user).then(() => {
    // Only create token for user if save was successful for a given duration
    const token = jwt.sign({ id: opts.user.id }, authConfig.secret, { expiresIn: authConfig.tokenValidity });
    // Set cookie with expiration for session according to auth config (must be in ms, so x1000)
    opts.res.cookie('jwtToken', token, { maxAge: (authConfig.tokenValidity * 1000), httpOnly: true });
    // Send proper redirection after login
    const responseObject = global.log.buildResponseFromCode('B_LOGIN_SUCCESS', { url: '/home' }, opts.user.username);
    opts.res.status(responseObject.status).send(responseObject);
  }).catch(args => {
    const responseObject = global.log.buildResponseFromCode(args.code, {}, args.err);
    opts.res.status(responseObject.status).send(responseObject);
  });
};


// Confirm registration and save new user in database
const _finalizeRegistration = opts => {
  if (opts.firstAccount && opts.form.code !== authConfig.adminCode) {
    const responseObject = global.log.buildResponseFromCode('B_REGISTER_INVALID_CODE');
    opts.res.status(responseObject.status).send(responseObject);
    return;
  }
  // Search for existing parent
  UserHelper.get({ filter: { code: opts.form.code }, empty: true }).then(godfather => {
    // User hierarchy update if not first register on app
    if (!opts.firstAccount) {
      // First account invite code is handle before
      if (!godfather) {
        const responseObject = global.log.buildResponseFromCode('B_REGISTER_INVALID_CODE');
        opts.res.status(responseObject.status).send(responseObject);
        return;
      } else {
        // Update new user and its godfather information
        global.log.info(`Updating ${godfather.username} code and add ${opts.user.username} to its children list`);
        godfather.code = utils.genInviteCode();
        godfather.children.push(opts.user._id);
        opts.user.depth = godfather.depth + 1;
        opts.user.parent = godfather._id;
        if (opts.user.depth >= global.settings.get('maxDepth')) {
          global.log.info('New user has reached max depth from root account, revoking its code to invite new user');
          opts.user.code = ''; // Remove invite code if max depth is reached
        }
      }
    } else {
      opts.user.parent = opts.user._id;
    }
    // Retrieve roles from model
    global.log.info(`Assign roles to the new user ${opts.user.username}`);
    RoleHelper.get({ filter: { name: ['user', 'admin'] }, multiple: true }).then(roles => {
      // Create dates for user
      opts.user.registration = new Date();
      opts.user.lastlogin = new Date();
      // Assign role(s) to newly created user
      opts.user.roles = [];
      for (let i = 0; i < roles.length; ++i) {
        // Grant user role by default
        if (roles[i].name === 'user') {
          opts.user.roles.push(roles[i]._id);
        }
        // Grant admin role only if no previous user exists
        if (roles[i].name === 'admin' && opts.firstAccount) {
          opts.user.roles.push(roles[i]._id);
        }
      }
      // Generate and assign avatar to the user
      const avatarName = `${utils.genAvatarName(opts.user.username + new Date())}`;
      new identicon(avatarName);
      opts.user.avatar = `${avatarName}.png`;
      opts.user.avatarList.push(`${avatarName}.png`);
      // Database save for user and its godfather promised to avoid internal errors
      const promises = [];
      // Update godfather with new children and code
      if (godfather) {
        promises.push(new Promise((resolve, reject) => {
          global.log.info(`Saving user's godfather ${godfather.username} in database`);
          UserHelper.save(godfather).then(resolve).catch(reject);
        }));
      }
      // Save new user with roles
      promises.push(new Promise((resolve, reject) => {
        global.log.info(`Saving new user ${opts.user.username} in database`);
        UserHelper.save(opts.user).then(resolve).catch(reject);
      }));
      // Redirect client when all saves are OK
      Promise.all(promises).then(() => {
        // Session cookie expires in one day
        const token = jwt.sign({ id: opts.user.id }, authConfig.secret, { expiresIn: authConfig.tokenValidity });
        opts.res.cookie('jwtToken', token, { maxAge: (authConfig.tokenValidity * 1000), httpOnly: true });
        // Send proper redirection after registration
        const responseObject = global.log.buildResponseFromCode('B_REGISTER_SUCCESS', { url: '/register/activate' }, opts.user.username);
        opts.res.status(responseObject.status).send(responseObject);
      }).catch(args => {
        const responseObject = global.log.buildResponseFromCode(args.code, {}, args.err);
        opts.res.status(responseObject.status).send(responseObject);
      });
    }).catch(args => {
      const responseObject = global.log.buildResponseFromCode(args.code, {}, args.err);
      opts.res.status(responseObject.status).send(responseObject);
    });
  }).catch(args => {
    const responseObject = global.log.buildResponseFromCode(args.code, {}, args.err);
    opts.res.status(responseObject.status).send(responseObject);
  });
};


// Internal method to send user an email with activation link
const _sendActivationToken = opts => {
  return new Promise((resolve, reject) => {
    // Create confirm token that will be sent to email
    const userToken = AuthTokenHelper.new({
      userId: opts.user.id,
      token: utils.genAuthToken(),
      createdAt: new Date()
    });
    // Now gen the activation token and send it by mail to the user
    AuthTokenHelper.save(userToken).then(() => {
      const transporter = nodemailer.createTransport(mailConfig.transport);
      const mailOptions = {
        from: mailConfig.sender,
        to: opts.user.email,
        subject: `[${process.env.APP_NAME}] Account activation link`,
        html: MailHelper.activationLinkMail({
          user: opts.user,
          url: `${opts.req.headers.host}/verify/${opts.user.email}/${userToken.token}`
        })
      };
      transporter.sendMail(mailOptions).then(resolve).catch(reject);
    }).catch(args => {
      reject(args);
    });
  });
};


/* Exported methods */


// Public template, /login
exports.loginTemplate = (req, res) => {
  global.log.info('Rendering template for the /login page');
  res.render('partials/auth/login', {
    layout: 'auth',
    lang: req.locale,
    allowRegistration: !global.settings.get('lockRegistration')
  });
};


// Login client submission, /api/auth/login
exports.loginPost = (req, res) => {
  global.log.info(`Request ${req.method} API call on /api/auth/login`);
  const form = req.body;
  const formError = FormHelper.login(form);
  if (formError) {
    res.status(formError.status).send(formError);
    return;
  }
  // Search username/email in database then test password matching
  global.log.info(`Form data is valid, now searching for ${form.username} by username in database`);
  UserHelper.get({ filter: { username: form.username }, populate: true, empty: true }).then(user => {
    // Not found by username, try to find user in database by email
    if (!user) {
      global.log.info(`Username not found. Searching for ${form.username} by email in database`);
      UserHelper.get({ filter: { email: form.username }, populate: true }).then(user => {
        // User has been found by email, check its password validity
        global.log.info(`${form.username} found by email in database`);
        _finalizeLogin({
          req: req,
          res: res,
          user: user,
          form: form,
        });
      }).catch(opts => {
        const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
        res.status(responseObject.status).send(responseObject);
      });
    } else {
      // User has been found by username, check its password validity
      global.log.info(`${form.username} found by username in database`);
      _finalizeLogin({
        req: req,
        res: res,
        user: user,
        form: form,
      });
    }
  }).catch(opts => {
    const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
    res.status(responseObject.status).send(responseObject);
  });
};


// Public template, /register
exports.registerTemplate = (req, res) => {
  global.log.info('Rendering template for the /register page');
  res.render('partials/auth/register', {
    layout: 'auth',
    lang: req.locale
  });
};


// Register client submission, /api/auth/register
exports.registerPost = (req, res) => {
  global.log.info(`Request ${req.method} API call on /api/auth/register`);
  const form = req.body;
  const formError = FormHelper.register(form);
  if (formError) {
    res.status(formError.status).send(formError);
    return;
  }
  // Create user from model with form info
  global.log.info('Form data is valid, now testing if registration if valid as well');
  const user = UserHelper.new({
    username: form.username,
    email: form.email,
    code: utils.genInviteCode(),
    password: bcrypt.hashSync(form.pass1, authConfig.saltRounds),
    depth: 0, // Init with depth 0, updated later in godfather checks
  });
  // Check whether it's first register or not by counting item in User table
  global.log.info('Determine if registration is for the first account on app');
  UserHelper.count().then(count => {
    // Finalize registration
    global.log.info(`Found ${count} registered user(s), now finalize registration process`);
    _finalizeRegistration({
      req: req,
      res: res,
      user: user,
      form: form,
      firstAccount: (count === 0)
    });
  }).catch(opts => {
    const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
    res.status(responseObject.status).send(responseObject);
  });
};


// Register activation using token sent by email to new user, /register/activate
exports.registerActivateTemplate = (req, res) => {
  global.log.info('Request template for the /register/activate page');
  UserHelper.get({ id: req.userId }).then(user => {
    _sendActivationToken({
      req: req,
      res: res,
      user: user
    }).then(() => {
      global.log.info('Rendering template for the /register/activate page');
      res.render('partials/auth/activate', {
        layout: 'auth',
        lang: req.locale,
        error: false,
        email: user.email
      });
    }).catch(opts => {
      if (opts.code) {
        global.log.logFromCode(opts.code, opts.err);
      } else {
        global.log.error(opts);
      }
      global.log.info('Rendering template for the /register/activate page with restricted content due to internal error');
      res.render('partials/auth/activate', {
        layout: 'auth',
        lang: req.locale,
        error: true
      });
    });
  }).catch(opts => {
    global.log.logFromCode(opts.code, opts.err);
    global.log.info('Rendering template for the /register/activate page with restricted content due to internal error');
    res.render('partials/auth/activate', {
      layout: 'auth',
      lang: req.locale,
      error: true
    });
  });
};


// Verify user (set it active) when auth token is consumed, /verify/:email/:token
exports.verify = (req, res) => {
  global.log.info(`Request a token activation for ${req.params.email} from /verify/:email/:token`);
  AuthTokenHelper.get(req.params.token).then(authToken => {
    UserHelper.get({ filter: { _id: authToken._userId, email: req.params.email } }).then(user => {
      if (user.active) {
        global.log.info('User is already activated, redirecting to /home');
        res.redirect(302, '/home');
      } else {
        user.active = true;
        UserHelper.save(user).then(() => {
          // Now delete token as activation process is done
          AuthTokenHelper.delete(authToken).then(() => {
            global.log.info('Account activation successful, redirecting to /home');
            res.redirect(302, '/home');
          }).catch(opts => {
            global.log.logFromCode(opts.code, opts.err);
            res.redirect(302, '/');
          });
        }).catch(opts => {
          global.log.logFromCode(opts.code, opts.err);
          res.redirect(302, '/');
        });
      }
    }).catch(opts => {
      global.log.logFromCode(opts.code, opts.err);
      res.redirect(302, '/');
    });
  }).catch(opts => {
    global.log.logFromCode(opts.code, opts.err);
    res.redirect(302, '/');
  });
};


// Logout redirection url, /logout
exports.logout = (req, res) => {
  global.log.info('Request /logout action');
  res.clearCookie('jwtToken');
  res.redirect(302, '/');
};
