const multer = require('multer');


// Multer middleware to upload image and save it in the /assets/img/uploads/tmp folder before treating it
uploadAvatar = (req, res, next) => {
  global.log.info('Request an avatar upload to the uploads/tmp folder');
  const upload = multer({
    dest: './assets/img/uploads/tmp'
  }).single('avatar');
  // Try to upload image to the server
  upload(req, res, uploadErr => {
    if (uploadErr) {
      const responseObject = global.log.buildResponseFromCode('B_INTERNAL_ERROR_FILE_UPLOAD', {}, uploadErr);
      res.status(responseObject.status).send(responseObject);
    } else {
      global.log.info('Image successfully uploaded in uploads/tmp folder, continue route execution');
      next();
    }
  });
};


module.exports = {
  uploadAvatar
};