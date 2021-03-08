const authConfig = require('../config/auth.config');


/* This helper will perform standard test on form data to avoid the wrong arguments to be sent to database */


// Form data coming from /api/auth/login
exports.login = form => {
  // Prevent wrong arguments sent to POST
  if (form.username === undefined || form.password === undefined) {
    return global.log.buildResponseFromCode('B_LOGIN_INVALID_FIELD');
  }
  // Prevent missing arguments from request
  if (form.username === '' || form.password === '') {
    return global.log.buildResponseFromCode('B_LOGIN_MISSING_FIELD', {
      missing: {
        username: !form.username,
        password: !form.password
      }
    });
  }
  // No error found in form data
  return null;
};


// Form data coming from /api/auth/register
exports.register = form => {
  // Prevent wrong arguments sent to API
  if (form.username === undefined || form.email === undefined || form.code === undefined || form.pass1 === undefined || form.pass2 === undefined) {
    return global.log.buildResponseFromCode('B_REGISTER_INVALID_FIELD');
  }
  // Prevent missing arguments from request
  if (form.username === '' || form.email === '' || form.code === '' || form.pass1 === '' || form.pass2 === '') {
    return global.log.buildResponseFromCode('B_REGISTER_MISSING_FIELD', {
      missing: {
        username: !form.username,
        email: !form.email,
        code: !form.code,
        pass1: !form.pass1,
        pass2: !form.pass2
      }
    });
  }
  // Password matching verification
  if (form.pass1 !== form.pass2) {
    return global.log.buildResponseFromCode('B_REGISTER_DIFFERENT_PASSWORDS');
  }
  // Password length matching auth config length
  if (form.pass1.length < authConfig.passwordLength) {
    return global.log.buildResponseFromCode('B_REGISTER_PASSWORD_TOO_SHORT', {}, authConfig.passwordLength);
  }
  // No error found in form data
  return null;
};


// Form data coming from /api/user/update/info
exports.updateInfo = form => {
  // Prevent wrong arguments sent to POST
  if (form.username === undefined || form.email === undefined) {
    return global.log.buildResponseFromCode('B_PROFILE_UPDATE_INFO_INVALID_FIELD');
  }
  // Prevent missing arguments from request
  if (form.username === '' || form.email === '') {
    return global.log.buildResponseFromCode('B_PROFILE_UPDATE_INFO_MISSING_FIELD');
  }
  // No error found in form data
  return null;
};


// Form data coming from /api/user/update/password
exports.updatePassword = form => {
  // Prevent wrong arguments sent to POST
  if (form.pass1 === undefined || form.pass2 === undefined || form.pass3 === undefined) {
    return global.log.buildResponseFromCode('B_PROFILE_UPDATE_PASSWORD_INVALID_FIELD');
  }
  // Prevent all missing arguments from request
  if (form.pass1 === '' && form.pass2 === '' && form.pass3 === '') {
    return global.log.buildResponseFromCode('B_PROFILE_UPDATE_PASSWORD_EMPTY_FIELD');
  }
  // Prevent missing arguments from request
  if (form.pass1 === '' || form.pass2 === '' || form.pass3 === '') {
    return global.log.buildResponseFromCode('B_PROFILE_UPDATE_PASSWORD_MISSING_FIELD', {
      missing: {
        pass1: !form.pass1,
        pass2: !form.pass2,
        pass3: !form.pass3
      }
    });
  }
  // Sent password not matching
  if (form.pass2 !== form.pass3) {
    return global.log.buildResponseFromCode('B_PROFILE_UPDATE_PASSWORD_DIFFERENT_PASSWORDS');
  }
  // Test actual changing of password
  if (form.pass1 === form.pass2) {
    return global.log.buildResponseFromCode('B_PROFILE_UPDATE_PASSWORD_SAME_PASSWORDS');
  }
  // New password doesn't meet the auth config length
  if (form.pass2.length < authConfig.passwordLength) {
    return global.log.buildResponseFromCode('B_PROFILE_UPDATE_PASSWORD_PASSWORD_TOO_SHORT', {}, authConfig.passwordLength);
  }
  // No error found in form data
  return null;
};


// Form data coming from /api/user/update/role
exports.updateRole = form => {
  // Prevent wrong arguments sent to POST
  if (form.userId === undefined || form.roleId === undefined || typeof form.checked !== 'boolean') {
    return global.log.buildResponseFromCode('B_PROFILE_UPDATE_ROLE_INVALID_FIELD');
  }
  // Prevent missing arguments from request
  if (form.userId === '' || form.roleId === '') {
    return global.log.buildResponseFromCode('B_PROFILE_UPDATE_ROLE_MISSING_FIELD');
  }
  // No error found in form data
  return null;
};
