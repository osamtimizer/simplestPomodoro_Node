var newrelic = require('newrelic');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('./logger');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var helmet = require('helmet');

const admin = require('./firebase_init');
const auth = admin.auth();
const database = admin.database();

var index = require('./routes/index');
var signup = require('./routes/signup');
var users = require('./routes/users');
var login = require('./routes/login');
var logout = require('./routes/logout');
var home = require('./routes/home');
var activity = require('./routes/activity');
var task_management= require('./routes/task_management');
var settings = require('./routes/settings');
var debug = require('./routes/debug');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

let redis_store;

if (process.env.WORKING_MODE=== 'debug') {
  redis_store = new RedisStore();
} else {
  //production
  redis_store = new RedisStore({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  });
}

//TODO:PRODUCTION:set SESSION_SECRET value in env
//name also should be written in env
var key = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'simplestpomodoro',
  cookie: {
    maxAge: 30 * 60 * 1000
  },
  store: new RedisStore()
};

app.use(session(key));

//middlewares

//middleware:Auth session
const authentication = (req, res, next) => {
  if(req.session.user !== undefined) {
    console.log("Middleware: authentication is called");
    next();
  } else {
    console.log("no session");
    res.redirect('/login');
  }
};

//middleware:logging
const accessLog = (req, res, next) => {
  const system = logger.system;

  const ip = req.ip;
  const url = decodeURI(req.url);
  const method = req.method;
  const params = JSON.stringify(req.params);
  let log = `IP:${ip}, Url:${url}, Method:${method}, Params:${params}`;

  system.info(log);

  next();
};

app.use(accessLog);

app.use('/', index);
app.use('/signup', signup);
app.use('/login', login);
app.use('/logout', logout);
app.use('/users', users);

if (process.env.WORKING_MODE=== 'debug') {
  console.log("WORKING_MODE:", process.env.WORKING_MODE);
  app.use('/debug', debug);
}

app.use(authentication);

//These routes require authentication.
app.use('/home', home);
app.use('/activity', activity);
app.use('/task_management', task_management);
app.use('/settings', settings);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
