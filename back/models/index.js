const mongoose = require('mongoose');
mongoose.Promise = global.Promise;


module.exports = {
  mongoose: mongoose,
  user: require('./user.model'),
  role: require('./role.model'),
  authtoken: require('./authtoken.model'),
  article: require('./article.model')
};
