const mongoose = require('mongoose');
const authConfig = require('../config/auth.config');


const AuthToken = mongoose.model('AuthToken', new mongoose.Schema({
  _userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: { expires: authConfig.tokenValidity } }
}));


module.exports = AuthToken;
