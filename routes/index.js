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

router.get('/terms-of-use', (req, res, next) => {
  res.render('eula.pug');
});

module.exports = router;
