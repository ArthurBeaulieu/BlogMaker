require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const i18n = require('i18n');
const path = require('path');
const compression = require('compression');
const handlebars = require('express-handlebars');
const db = require('./models');
const dbConfig = require('./config/db.config');
const settings = require('./utils/settings');
const logger = require('./utils/logger');
const utils = require('./utils/server.utils');


const version = '1.0.0';


// Create logger instance and attach it to the global object to make it available app-wide
global.log = new logger({
  debug: true
});


// Create setting instance to load app settings from util class
global.settings = new settings();


// Express configuration for server
global.log.info(`Starting UserStack server v${version}`);
const app = express();
app.use(express.static('assets'));
app.use(cors({ origin: 'http://localhost:3001' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


// i18n translation configuration
global.log.info('Configuring i18n engine');
i18n.configure({
  locales: ['en', 'fr'],
  cookie: 'locale',
  directory: path.join(__dirname, '../assets/locales'),
  defaultLocale: 'en',
  objectNotation: true
});
app.use(i18n.init);


// Handlebars template engine configuration
global.log.info('Configuring template rendering engine');
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/views`);
app.engine('handlebars', handlebars({
  defaultLayout: 'index',
  layoutsDir: `${__dirname}/views/layouts`,
  partialsDir: `${__dirname}/views/partials`,
  helpers: {
    i18n: () => {
      return i18n.__.apply(this, arguments);
    },
    __n: () => {
      return i18n.__n.apply(this, arguments);
    }
  }
}));


// Enable GZIP compression with compression middleware
app.use(compression());


// App urls routing
global.log.info('Reading routes to be used by client');
require('./routes/app.routes')(app);
require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);
require('./routes/admin.routes')(app);
require('./routes/template.routes')(app);


// Sockets communication
const server = require('http').createServer(app);
const io = require('socket.io')(server);
require('./sockets/app.socket')(io);


// Database connection and app starting
global.log.info('Connecting server to the database');
db.mongoose.connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.NAME}`, {
  authSource: dbConfig.NAME,
  user: dbConfig.USERNAME,
  pass: dbConfig.PASSWORD,
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  global.log.info('Connection to MongoDB successful');
  // Perform initial sequence to check for proper collection
  utils.initSequence().then(() => {
    // Start listening for events on port 3000, on server instead of app to make socket work
    server.listen(3000, () => {
      global.log.info('UserStack server is ready to operate!');
    });
    // Add listener on kill process to properly log before exit
    process.on('SIGINT', () => {
      global.log.info('Gracefully stopping UserStack server');
      process.exit();
    });
  }).catch(err => {
    global.log.error(`Unable to update database model : ${err}`);
    global.log.error('Gracefully stopping UserStack server');
    process.exit();
  });
}).catch(err => {
  global.log.error(`Unable to connect to the database : ${err}`);
  global.log.error('Gracefully stopping UserStack server');
  process.exit();
});
