const db = require('../models');


const Article = db.article;


/* This helper provides a promised way to use mongoose and properly handle errors */


// Returns a new User with specific internals
exports.new = opts => {
  return new Article({
    _userId: opts.userId,
    createdAt: opts.createdAt,
    published: opts.published,
    title: opts.title,
    description: opts.description,
    content: opts.content
  });
};


// User getter, by id, by name, or with custom filter, to return one or many users
exports.get = opts => {
  return new Promise((resolve, reject) => {
    // Enclosed method to perform standard failure test upon model response
    const rejection = (articleFindErr, article) => {
      // Internal server error when trying to retrieve user from database
      if (articleFindErr) {
        const err = new Error(articleFindErr);
        reject({ code: 'B_INTERNAL_ERROR_ARTICLE_FIND', err: err.toString() });
      }
      // User not found in database
      if (!article) {
        if (opts.empty) {
          resolve(null);
        } else {
          reject({ code: 'B_ARTICLE_NOT_FOUND' });
        }
      }
    };
    // Find user depending on opts type
    if (opts.id) { // Find by ID
      Article.findById(opts.id, (articleFindErr, article) => {
        rejection(articleFindErr, article);
        resolve(article);
      });
    } else if (opts.filter) {
      if (opts.multiple) {
        Article.find(opts.filter, (articleFindErr, articles) => {
          rejection(articleFindErr, articles);
          resolve(articles);
        });
      } else {
        Article.findOne(opts.filter, (articleFindErr, article) => {
          rejection(articleFindErr, article);
          resolve(article);
        });
      }
    } else {
      Article.find().limit(opts.perPage).skip(opts.perPage * opts.page).sort({ createdAt: -1 }).exec((err, articles) => {
        Article.countDocuments().exec((err, count) => {
          resolve({ articles: articles, total: count });
        });
      });
    }
  });
};


// Save the article into the database
exports.save = article => {
  return new Promise((resolve, reject) => {
    article.save(articleSaveErr => {
      if (articleSaveErr) {
        const err = new Error(articleSaveErr);
        reject({ code: 'B_INTERNAL_ERROR_ARTICLE_SAVE', err: err.toString() });
      }
      resolve();
    });
  });
};
