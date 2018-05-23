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

router.get('/help', (req, res, next) => {
  res.render('help');
});

router.get('/terms-of-use', (req, res, next) => {
  if (req.session.agreement) {
    res.redirect('/register');
  } else if (req.session.user) {
    res.redirect('/home');
  } else {
    next();
  }
},(req, res, next) => {
  res.render('eula.pug');
});

router.post('/terms-of-use', (req, res, next) => {
  if (req.body.agreed === 'true') {
    req.session.agreement = { agreed: true };
    res.redirect('/register');
  } else {
    console.log('not agreed');
    res.redirect('/terms-of-use');
  }
});

module.exports = router;
