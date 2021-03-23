const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const authConfig = require('../config/auth.config');
const fileConfig = require('../config/file.config');
const UserHelper = require('../helpers/user.helper');
const RoleHelper = require('../helpers/role.helper');
const FormHelper = require('../helpers/form.helper');
const identicon = require('../utils/identicon');
const utils = require('../utils/server.utils');


// For a given user, connect all its children to its godfather
const _connectChildrenToGodfather = (godfather, children) => {
  return new Promise((resolve, reject) => {
    const connectChild = i => {
      if (i < children.length) {
        // Find matching user for token ID
        UserHelper.get({ id: children[i] }).then(user => {
          global.log.info(`Attaching ${user.username} as a children of ${godfather.username}`);
          godfather.children.push(user._id);
          user.parent = godfather._id;
          --user.depth; // Decrement user depth to match its previous parent one
          if (user.code === '') {
            user.code = utils.genInviteCode(); // Generate new invite code as user depth has been reduced from one level
          }
          // Saving godfather and user
          UserHelper.save(godfather).then(() => {
            UserHelper.save(user).then(() => {
              connectChild(++i);
            }).catch(reject);
          }).catch(reject);
        }).catch(reject);
      } else {
        resolve();
      }
    };
    if (children.length === 0) {
      resolve();
    } else {
      // Start recursive calls
      connectChild(0);
    }
  });
};


/* Exported methods */


// Private /profile template (for authenticated users), /profile
exports.profileTemplate = (req, res) => {
  global.log.info('Request template for the /profile page');
  UserHelper.get({ id: req.userId }).then(user => {
    global.log.info(`Matching user ${user.username} to display the profile`);
    UserHelper.get({ id: user.parent || '', empty: true }).then(godfather => {
      global.log.info(`Matching godfather ${godfather.username} for user ${user.username}`);
      RoleHelper.get({ filter: { _id: user.roles }, multiple: true }).then(userRoles => {
        const roles = [];
        for (let i = 0; i < userRoles.length; ++i) {
          roles.push(utils.i18nLocal(req, `user.profile.${userRoles[i].name}Role`));
        }
        global.log.info('Rendering template for the /profile page');
        res.render('partials/user/profile', {
          layout: 'user',
          lang: req.locale,
          username: user.username,
          email: user.email,
          avatar: `/img/avatars/${user.avatar}`,
          code: user.code,
          depth: user.depth,
          godfather: godfather.username,
          registration: utils.formatDate(user.registration),
          lastLogin: utils.formatDate(user.lastlogin),
          isVerified: user.active,
          roles: roles
        });
      }).catch(opts => {
        if (opts.err) {
          const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
          res.status(responseObject.status).send(responseObject);
        } else {
          global.log.logFromCode(opts.code, {}, opts.err);
          res.redirect(302, '/');
        }
      });
    }).catch(opts => {
      const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
      res.status(responseObject.status).send(responseObject);
    });
  }).catch(opts => {
    global.log.logFromCode(opts.code, {}, opts.err);
    res.redirect(302, '/');
  });
};


// Private /profile/edit template (for authenticated users), /profile/edit
exports.profileEditTemplate = (req, res) => {
  global.log.info('Request template for the /profile/edit page');
  // Find matching user for token ID
  UserHelper.get({ id: req.userId }).then(user => {
    const avatarList = [];
    if (user.avatarList.length > 1) {
      for (let i = user.avatarList.length - 2; i >= 0; --i) {
        avatarList.push(`/img/avatars/${user.avatarList[i]}`);
      }
    }
    global.log.info('Rendering template for the /profile/edit page');
    res.render('partials/user/edit', {
      layout: 'user',
      lang: req.locale,
      username: user.username,
      email: user.email,
      avatar: `/img/avatars/${user.avatar}`,
      avatarList: avatarList
    });
  }).catch(opts => {
    global.log.buildResponseFromCode(opts.code, {}, opts.err);
    res.redirect(302, '/');
  });
};


// Submission from user information submit, /api/user/update/info
exports.updateInfo = (req, res) => {
  global.log.info(`Request ${req.method} API call on /api/user/update/info`);
  const form = req.body;
  const formError = FormHelper.updateInfo(form);
  if (formError) {
    res.status(formError.status).send(formError);
    return;
  }
  // Find matching user for token ID
  global.log.info(`Search a matching user for id ${req.userId}`);
  UserHelper.get({ id: req.userId }).then(user => {
    global.log.info(`Matching user ${user.username} to update the info`);
    // Ensure fields contains changes
    if (user.username === form.username && user.email === form.email) {
      const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPDATE_INFO_NO_CHANGES');
      res.status(responseObject.status).send(responseObject);
      return;
    }
    // Internal variables
    const promises = [];
    let taken = {
      username: false,
      email: false
    };
    // Enclosed method to check if user exists (from username or email). If not, saving new one to user
    const findUser = opts => {
      return new Promise((resolve, reject) => {
        UserHelper.get({ filter: opts.filter }).then(matchingUser => {
          // Not changing user[type] as its already taken in database
          if (matchingUser) {
            taken[opts.type] = true;
            resolve();
          }
        }).catch(args => {
          if (args.code === 'B_USER_NOT_FOUND') {
            user[opts.type] = form[opts.type];
            UserHelper.save(user).then(resolve).catch(reject);
          } else {
            reject(args);
          }
        });
      });
    };
    // In case username changed, check if new one doesn't already exists in database
    if (user.username !== form.username) {
      global.log.info('Search in database if new username is not already taken');
      promises.push(
        findUser({
          filter: { username: form.username },
          type: 'username'
        })
      );
    }
    // In case email changed, check if new one doesn't already exists in database
    if (user.email !== form.email) {
      global.log.info('Search in database if new email is not already taken');
      promises.push(
        findUser({
          filter: { email: form.email },
          type: 'email'
        })
      );
    }
    // When all promises are resolved, prepare client response
    Promise.all(promises).then(() => {
      // Send response to client
      const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPDATE_INFO_UPDATED', {
        info: {
          username: user.username,
          email: user.email
        },
        taken: {
          username: taken.username,
          email: taken.email
        }
      });
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


// Submission from user password fields submit, /api/user/update/password
exports.updatePassword = (req, res) => {
  global.log.info(`Request ${req.method} API call on /api/user/update/password`);
  const form = req.body;
  const formError = FormHelper.updatePassword(form);
  if (formError) {
    res.status(formError.status).send(formError);
    return;
  }
  // Find matching user for token ID
  global.log.info(`Search a matching user for id ${req.userId}`);
  UserHelper.get({ id: req.userId }).then(user => {
    global.log.info(`Matching user ${user.username} to update the password`);
    // Password not matching the user
    if (!bcrypt.compareSync(form.pass1, user.password)) {
      const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPDATE_PASSWORD_INVALID_PASSWORD');
      res.status(responseObject.status).send(responseObject);
      return;
    }
    // Hashing new password and save it for the user
    user.password = bcrypt.hashSync(form.pass2, authConfig.saltRounds);
    UserHelper.save(user).then(() => {
      // Send password update success to the client
      const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPDATE_PASSWORD_SUCCESS');
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


// Submission to update avatar, /api/user/update/avatar
exports.updateAvatar = (req, res) => {
  const clickedAvatar = path.basename(req.body.src);
  UserHelper.get({ id: req.userId }).then(user => {
    const index = user.avatarList.indexOf(clickedAvatar);
    // Avatar name is not in user avatar list, immediate return to avoid tentative to remove avatars that are not user's ones
    if (index === -1) {
      const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPDATE_AVATAR_NOT_FOUND');
      res.status(responseObject.status).send(responseObject);
      return;
    }
    // Get avatar index in list, splice it and re-append it to the end of the array to make it the active one
    user.avatarList.splice(index, 1);
    user.avatarList.push(clickedAvatar);
    user.avatar = clickedAvatar;
    // Then save user in database
    UserHelper.save(user).then(() => {
      const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPDATE_AVATAR_SUCCESS', { url: '/profile/edit' }, user.username);
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


// Submission to delete an avatar, /api/user/delete/avatar
exports.deleteAvatar = (req, res) => {
  const clickedAvatar = path.basename(req.body.src);
  UserHelper.get({ id: req.userId }).then(user => {
    const index = user.avatarList.indexOf(clickedAvatar);
    // Avatar name is not in user avatar list, immediate return to avoid tentative to remove avatars that are not user's ones
    if (index === -1) {
      const responseObject = global.log.buildResponseFromCode('B_PROFILE_DELETE_AVATAR_NOT_FOUND');
      res.status(responseObject.status).send(responseObject);
      return;
    }
    // Clear target avatar from fs
    fs.unlink(path.join(__dirname, `../../assets/img/avatars/${clickedAvatar}`), removeErr => {
      if (removeErr) {
        const responseObject = global.log.buildResponseFromCode('B_PROFILE_DELETE_AVATAR_UNLINK_ERROR', {}, removeErr);
        res.status(responseObject.status).send(responseObject);
        return;
      }
      // Update user avatar list and current avatar
      user.avatarList.splice(index, 1);
      user.avatar = user.avatarList[user.avatarList.length - 1];
      // Re-generate a random identicon for user if no avatar are left
      if (user.avatarList.length === 0) {
        const avatarName = `${utils.genAvatarName(user.username + new Date())}`;
        new identicon(avatarName);
        user.avatar = `${avatarName}.png`;
        user.avatarList.push(`${avatarName}.png`);
      }
      // Save user to database
      UserHelper.save(user).then(() => {
        const responseObject = global.log.buildResponseFromCode('B_PROFILE_DELETE_AVATAR_SUCCESS', { url: '/profile/edit' }, user.username);
        res.status(responseObject.status).send(responseObject);
      }).catch(opts => {
        const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
        res.status(responseObject.status).send(responseObject);
      });
    });
  }).catch(opts => {
    const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
    res.status(responseObject.status).send(responseObject);
  });
};


// Submission to update avatar, /api/user/upload/avatar
exports.uploadAvatar = (req, res) => {
  global.log.info(`Request ${req.method} API call on /api/user/upload/avatar`);
  global.log.info(`Search a matching user for id ${req.userId}`);
  UserHelper.get({ id: req.userId }).then(user => {
    const tempPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const avatarName = `${utils.genAvatarName(user.username + new Date())}${ext}`;
    const targetPath = path.join(__dirname, `../../assets/img/avatars/${avatarName}`);
    const acceptedExt = fileConfig.allowedImgExt;
    if (acceptedExt.indexOf(ext) !== -1) {
      // Dimension check
      const dimensions = sizeOf(tempPath)
      if (dimensions.height > fileConfig.maxImgSize || dimensions.width > fileConfig.maxImgSize) {
        const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPLOAD_AVATAR_SIZE_ERROR', {}, fileConfig.maxImgSize);
        res.status(responseObject.status).send(responseObject);
        return;
      }
      // Save temp file to avatars folder
      fs.rename(tempPath, targetPath, renameErr => {
        if (renameErr) {
          const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPLOAD_AVATAR_RENAME_ERROR', {}, renameErr);
          res.status(responseObject.status).send(responseObject);
          return;
        }
        // Update user avatar information with new avatar
        user.avatar = avatarName;
        user.avatarList.push(avatarName);
        UserHelper.save(user).then(() => {
          const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPLOAD_AVATAR_SUCCESS', { url: '/profile/edit' }, user.username);
          res.status(responseObject.status).send(responseObject);
        }).catch(opts => {
          const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
          res.status(responseObject.status).send(responseObject);
        });
      });
    } else {
      fs.unlink(tempPath, removeErr => {
        if (removeErr) {
          const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPLOAD_AVATAR_UNLINK_ERROR', {}, removeErr);
          res.status(responseObject.status).send(responseObject);
          return;
        }
        // Respond client with unsupported format exception
        const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPLOAD_AVATAR_UNSUPPORTED_FORMAT');
        res.status(responseObject.status).send(responseObject);
      });
    }
  }).catch(opts => {
    const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
    res.status(responseObject.status).send(responseObject);
  });
};


// Submission from user delete button or admin delete user button, /api/user/delete
exports.delete = (req, res) => {
  global.log.info(`Request ${req.method} API call on /api/user/delete`);
  let id = req.userId;
  // Delete come from a POST request
  if (req.body.userId) {
    id = req.body.userId;
  }
  // Find matching user for token ID
  global.log.info(`Search a matching user for id ${id}`);
  UserHelper.get({ id: id }).then(user => {
    global.log.info(`Matching user ${user.username} to be deleted`);
    if (user.parent.toString() !== id) { // Root parent is Root, avoid suppressing it, convert to string to make it comparable
      global.log.info(`Search a matching godfather for id ${user.parent}`);
      UserHelper.get({ id: user.parent }).then(godfather => {
        global.log.info(`Matching user ${godfather.username} to remove ${user.username} from its children`);
        // Remove user id from godfather children array
        const index = godfather.children.indexOf(id);
        if (index > -1) {
          godfather.children.splice(index, 1);
        }
        // Connect each user children to godfather
        global.log.info(`Start connecting all children of ${user.username} to its godfather ${godfather.username}`);
        _connectChildrenToGodfather(godfather, user.children).then(() => {
          // Finally delete account safely
          global.log.info(`Now deleting ${user.username} from database`);
          UserHelper.delete({ _id: user._id }).then(() => {
            // User deletion successful
            const responseObject = global.log.buildResponseFromCode('B_USER_DELETE_SUCCESS', { url: '/logout' });
            res.status(responseObject.status).send(responseObject);
          }).catch(opts => {
            const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
            res.status(responseObject.status).send(responseObject);
          });
        }).catch(opts => {
          const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
          res.status(responseObject.status).send(responseObject);
        });
      }).catch(opts => {
        const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
        res.status(responseObject.status).send(responseObject);
      });
    } else {
      const responseObject = global.log.buildResponseFromCode('B_NEVER_KILL_ROOT');
      res.status(responseObject.status).send(responseObject);
    }
  }).catch(opts => {
    const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
    res.status(responseObject.status).send(responseObject);
  });
};


// Submission from user role checkbox in admin users page, /api/user/update/role
exports.updateRole = (req, res) => {
  global.log.info(`Request ${req.method} API call on /api/user/update/role`);
  const form = req.body;
  const formError = FormHelper.updateRole(form);
  if (formError) {
    res.status(formError.status).send(formError);
    return;
  }
  // Find matching user for token ID
  global.log.info(`Search a matching user for id ${form.userId}`);
  UserHelper.get({ id: form.userId }).then(user => {
    global.log.info(`Matching user ${user.username} to update roles`);
    UserHelper.isAdminUser(user).then(isAdmin => {
      global.log.info(`Search a matching role for id ${form.roleId}`);
      RoleHelper.get({ id: form.roleId }).then(role => {
        global.log.info(`Matching role ${role.name} to update for ${user.username}`);
        if (form.checked === true) {
          user.roles.push(form.roleId);
        } else {
          // Forbid to remove admin role from root user (depth 0)
          if (isAdmin && role.name === 'admin') {
            const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPDATE_ROLE_CANT_REMOVE_ADMIN_FROM_ROOT');
            res.status(responseObject.status).send(responseObject);
            return;
          }
          // Otherwise remove role from user's one
          const index = user.roles.indexOf(form.roleId);
          if (index !== -1) {
            user.roles.splice(index, 1);
          }
        }
        // Update user into database
        UserHelper.save(user).then(() => {
          // Properly send success to the client
          const responseObject = global.log.buildResponseFromCode('B_PROFILE_UPDATE_ROLE_SUCCESS', {}, user.username);
          res.status(responseObject.status).send(responseObject);
        }).catch(opts => {
          const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
          res.status(responseObject.status).send(responseObject);
        });
      }).catch(opts => {
        const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
        res.status(responseObject.status).send(responseObject);
      });
    }).catch(opts => {
      const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
      res.status(responseObject.status).send(responseObject);
    });
  }).catch(opts => {
    const responseObject = global.log.buildResponseFromCode(opts.code, {}, opts.err);
    res.status(responseObject.status).send(responseObject);
  });
};
