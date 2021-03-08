const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.config.js');
const UserHelper = require('../helpers/user.helper');
const RoleHelper = require('../helpers/role.helper');


// Middleware to allow access to non-activated user
isNotActivated = (req, res, next) => {
  global.log.info(`Check if account with id ${req.userId} is not activated`);
  UserHelper.get({ id: req.userId }).then(user => {
    if (user.active) {
      global.log.info('Account is activated, redirecting to /home');
      res.redirect(302, '/home');
    } else {
      global.log.info('Account is not activated, continue route execution');
      next();
    }
  }).catch(opts => {
    global.log.logFromCode(opts.code, opts.err);
    res.redirect(302, '/');
  });
};


// Middleware to allow access to activated user
isActivated = (req, res, next) => {
  global.log.info(`Check if account with id ${req.userId} is activated`);
  UserHelper.get({ id: req.userId }).then(user => {
    if (user.active) {
      global.log.info('Account is activated, continue route execution');
      next();
    } else {
      global.log.info('Account is not activated, redirecting to /register/activate');
      res.redirect(302, '/register/activate');
    }
  }).catch(opts => {
    global.log.logFromCode(opts.code, opts.err);
    res.redirect(302, '/');
  });
};


// Middleware to check token validity from request's cookies to allow access
isLoggedIn = (req, res, next) => {
  global.log.info(`Request a token validation for url ${req.originalUrl}`);
  // Extract token from session cookies
  let token = req.cookies.jwtToken;
  if (!token) {
    global.log.warn('No valid token where found in cookies. Redirecting to /login');
    res.redirect(302, '/login');
    return;
  }
  // Check token with jwt token module
  jwt.verify(token, authConfig.secret, (err, decoded) => {
    if (err) {
      global.log.error('Access refused, the token is either invalid or expired. Redirecting to /login');
      res.redirect(302, '/login');
      return;
    }
    // Access granted, call next to exist middleware
    global.log.info(`Token validated, access granted for user with id ${decoded.id}`);
    req.userId = decoded.id; // Attach user id to the request before any further treatment
    next();
  });
};


// Middleware to check database to grant or not access if user has admin role
isAdmin = (req, res, next) => {
  global.log.info(`Request an admin check on user for url ${req.originalUrl}`);
  UserHelper.get({ id: req.userId }).then(user => {
    RoleHelper.get({ filter: { _id: { $in: user.roles } }, multiple: true }).then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === 'admin') {
          global.log.info('User has the admin role, access granted');
          next();
          return;
        }
      }
      global.log.info('User does not have the admin role, access refused. Redirecting to /');
      res.redirect(302, '/');
    }).catch(opts => {
      global.log.logFromCode(opts.code, opts.err);
      res.redirect(302, '/');
    });
  }).catch(opts => {
    global.log.logFromCode(opts.code, opts.err);
    res.redirect(302, '/');
  });
};


// Middleware to check if the lockRegistration setting is set
isRegistrationAllowed = (req, res, next) => {
  if (global.settings.get('lockRegistration')) {
    global.log.info('Registration are not allowed, redirecting to /');
    res.redirect(302, '/');
  } else {
    global.log.info('Registration are allowed, continue route execution');
    next();
  }
};


// Check if username/email are already taken in database, for API POST requests
checkDuplicateUsernameOrEmail = (req, res, next) => {
  global.log.info('Check existing username and mail in database');
  const form = req.body;
  if (form.username === undefined || form.email === undefined) {
    const responseObject = global.log.buildResponseFromCode('B_INVALID_FIELD');
    res.status(responseObject.status).send(responseObject);
    return;
  }

  if (form.username === '' || form.email === '') {
    const responseObject = global.log.buildResponseFromCode('B_MISSING_FIELD');
    res.status(responseObject.status).send(responseObject);
    return;
  }
  // Avoid to send status twice to frontend
  let usernameTaken = false;
  let emailTaken = false;
  const promises = [];
  // Username testing promise
  promises.push(new Promise((resolve, reject) => {
    UserHelper.get({ filter: { username: form.username }, empty: true }).then(user => {
      if (!user) {
        global.log.info('Requested username is available in database');
      } else {
        // User exists, reject username submission
        global.log.warn('Requested username is already taken in database');
        usernameTaken = true;
      }
      resolve();
    }).catch(opts => {
      reject(opts);
    });
  }));
  // Email testing promise
  promises.push(new Promise((resolve, reject) => {
    UserHelper.get({ filter: { email: form.email }, empty: true }).then(user => {
      if (!user) {
        global.log.info('Requested email is available in database');
      } else {
        // User exists, reject email submission
        global.log.warn('Requested email is already taken in database');
        emailTaken = true;
      }
      resolve();
    }).catch(opts => {
      reject(opts);
    });
  }));
  // Continue when all promises are resolved
  Promise.all(promises).then(() => {
    if (usernameTaken && emailTaken) {
      const responseObject = global.log.buildResponseFromCode('B_REGISTER_EXISTING_USERNAME_AND_EMAIL');
      res.status(responseObject.status).send(responseObject);
    } else if (usernameTaken) {
      const responseObject = global.log.buildResponseFromCode('B_REGISTER_EXISTING_USERNAME');
      res.status(responseObject.status).send(responseObject);
    } else if (emailTaken) {
      const responseObject = global.log.buildResponseFromCode('B_REGISTER_EXISTING_EMAIL');
      res.status(responseObject.status).send(responseObject);
    } else {
      global.log.info('Username and email are not taken in database');
      next();
    }
  }).catch(opts => {
    const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
    res.status(responseObject.status).send(responseObject);
  });
};


module.exports = {
  isNotActivated,
  isActivated,
  isLoggedIn,
  isAdmin,
  isRegistrationAllowed,
  checkDuplicateUsernameOrEmail
};
