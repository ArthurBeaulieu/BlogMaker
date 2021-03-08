module.exports = {
  secret: 'blogmaker-secret-key', // Secret key used to hash things (token etc)
  adminCode: 'GGJESUS', // The code to provide for first register on app
  passwordLength: 8,
  tokenValidity: 86400, // Token validity in seconds
  saltRounds: 8
};
