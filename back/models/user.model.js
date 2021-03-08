const mongoose = require('mongoose');


const User = mongoose.model('User', new mongoose.Schema({
  active: { type: Boolean, default: false },
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  avatar: String,
  avatarList: [],
  code: String,
  password: String,
  registration: Date,
  lastlogin: Date,
  parent: mongoose.Schema.Types.ObjectId,
  children: [],
  depth: Number,
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
}));


module.exports = User;
