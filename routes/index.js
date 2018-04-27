const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  if (req.session.user) {
    res.redirect('/home');
  } else {
    next();
  }
},(req, res, next) => {
  res.render('index', { title: 'SimplestPomodoro' });
});

module.exports = router;
