var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('./logger');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

const admin = require('./firebase_init');
const auth = admin.auth();
const database = admin.database();

var index = require('./routes/index');
var register = require('./routes/register');
var users = require('./routes/users');
var login = require('./routes/login');
var home = require('./routes/home');
var activity = require('./routes/activity');
var settings = require('./routes/settings');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('secret'));
app.use(express.static(path.join(__dirname, 'public')));

var key = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'simplestpomodoro',
  cookie: {
    maxAge: 30 * 60 * 1000
  }
};

app.use(session(key));

//middlewares

//Auth session
const authentication = (req, res, next) => {
  console.log(req.session);
  if(req.session.user) {
    console.log("Middleware: authentication is called");
    auth.verifyIdToken(req.session.user.token)
      .then((decodedToken) => {
        console.log("Middleware: token is valid");
        console.log("username", decodedToken.name);
        next();
      }).catch((err) => {
        console.error(err);
      });
  } else {
    console.log("no session");
    res.redirect('/login');
  }
};

//logging
const accessLog = (req, res, next) => {
  const access = logger.access;
  access.info("Access received");
  next();
};

app.use(accessLog);

app.use('/', index);
app.use('/register', register);
app.use('/login', login);

app.use(authentication);

//These routes require authentication.
app.use('/users', users);
app.use('/home', home);
app.use('/activity', activity);
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
