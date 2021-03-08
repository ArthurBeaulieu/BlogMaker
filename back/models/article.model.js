const mongoose = require('mongoose');


const Article = mongoose.model('Article', new mongoose.Schema({
  _userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  createdAt: Date,
  published: { type: Boolean, default: false },
  title: String,
  description: String,
  content: String
}));


module.exports = Article;
