const db = require('../models');


const Role = db.role;


/* This helper provides a promised way to use mongoose and properly handle errors */


// Role getter, by id, by name, or with custom filter, to return one or many roles
exports.get = opts => {
  return new Promise((resolve, reject) => {
    // Enclosed method to perform standard failure test upon model response
    const rejection = (roleFindErr, role) => {
      // Internal server error when trying to retrieve user from database
      if (roleFindErr) {
        const err = new Error(roleFindErr);
        reject({ code: 'B_INTERNAL_ERROR_ROLE_FIND', err: err.toString() });
      }
      // User not found in database
      if (!role) {
        reject({ code: 'B_ROLE_NOT_FOUND' });
      }
    };
    // Find role depending on opts type
    if (opts.id) { // Find by ID
      Role.findById(opts.id, (roleFindErr, role) => {
        rejection(roleFindErr, role);
        resolve(role);
      });
    } else if (opts.filter) {
      if (opts.multiple) {
        Role.find(opts.filter, (roleFindErr, roles) => {
          rejection(roleFindErr, roles);
          resolve(roles);
        });
      } else {
        Role.findOne(opts.filter, (roleFindErr, role) => {
          rejection(roleFindErr, role);
          resolve(role);
        });
      }
    }
  });
};


// Role getter to retrieve all saved roles in database
exports.getAll = () => {
  return new Promise((resolve, reject) => {
    Role.find({}, (findErr, roles) => {
      if (findErr) {
        reject(findErr)
      } else {
        resolve(roles);
      }
    });
  });
};
