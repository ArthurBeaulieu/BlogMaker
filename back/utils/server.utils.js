const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const i18n = require('i18n');
const db = require('../models');


const Role = db.role;


// Generates a user AuthToken
exports.genAuthToken = () => {
  return crypto.randomBytes(40).toString('hex').toUpperCase();
};


// Generates a user invite code
exports.genInviteCode = () => {
  return crypto.randomBytes(20).toString('hex').toUpperCase();
};


// Generates an avatar name. Warning, this could lead to collision
exports.genAvatarName = seed => {
  return bcrypt.hashSync(seed, 8).toUpperCase();
};


// Format a date stored in database to a more digest form
exports.formatDate = rawDate => {
  // Format date according to parameter, if no date were provided, simply use now date instead
  let d = (rawDate ? new Date(rawDate) : new Date());
  // Convert Js date into readable string with format YYYY/MM/DD - HH:MM
  const date = `${d.getFullYear()}/${('0' + (d.getMonth() + 1)).slice(-2)}/${('0' + d.getDate()).slice(-2)}`;
  const time = `${('0' + d.getHours()).slice(-2)}:${('0' + d.getMinutes()).slice(-2)}`;
  return `${date} - ${time}`;
};


// Convert a given phrase according to the request locale
exports.i18nLocal = (req, phrase) => {
  return i18n.__({ phrase: phrase, locale: req.getLocale() });
}


// Server initialisation sequence that runs everytime the server is launched
// On first launch, it will populate the role collection
exports.initSequence = () => {
  return new Promise((resolve, reject) => {
    global.log.info('BlogMaker init sequence to control the database state');
    const promises = [];
    // Check user roles collection
    promises.push(new Promise((resolve, reject) => {
      Role.estimatedDocumentCount((err, count) => {
        if (!err && count === 0) {
          const rolePromises = [];
          global.log.info('Creating Roles for current instance...');
          rolePromises.push(new Promise((resolve, reject) => {
            new Role({ name: 'user' }).save(roleSaveErr => {
              if (roleSaveErr) {
                global.log.logFromCode('B_INTERNAL_ERROR_ROLE_SAVE', roleSaveErr);
                reject();
              } else {
                global.log.info('User role has been added to the roles collection');
                resolve();
              }
            });
          }));
          rolePromises.push(new Promise((resolve, reject) => {
            new Role({ name: 'admin' }).save(roleSaveErr => {
              if (roleSaveErr) {
                global.log.logFromCode('B_INTERNAL_ERROR_ROLE_SAVE', roleSaveErr);
                reject();
              } else {
                global.log.info('Admin role has been added to the roles collection');
                resolve();
              }
            });
          }));
          Promise.all(rolePromises).then(() => {
            global.log.info('Roles collection is up to date');
            resolve();
          }).catch(() => {
            reject();
          });
        } else {
          global.log.info('Roles collection is up to date');
          resolve();
        }
      });
    }));
    Promise.all(promises).then(() => {
      global.log.info('Database model is complete');
      resolve();
    }).catch(reject);
  });
};
