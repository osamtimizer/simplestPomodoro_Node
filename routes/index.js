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

router.get('/privacy-policy', (req, res, next) => {
  if(req.session.user) {
    res.render('privacy_policy', {
      user: true
    });
  } else{
    res.render('privacy_policy');
  }
});

router.get('/terms-of-use', (req, res, next) => {
  if(req.session.user) {
    res.render('terms_of_use', {
      user: true
    });
  } else{
    res.render('terms_of_use');
  }
});

router.get('/help', (req, res, next) => {
  if(req.session.user) {
    res.render('help', {
      user: true
    });
  } else{
    res.render('help');
  }
});

router.get('/eula', (req, res, next) => {
  if (req.session.agreement) {
    res.redirect('/signup');
  } else if (req.session.user) {
    res.redirect('/home');
  } else {
    next();
  }
},(req, res, next) => {
  res.render('eula.pug');
});

router.post('/eula', (req, res, next) => {
  if (req.body.agreed === 'true') {
    req.session.agreement = { agreed: true };
    res.redirect('/signup');
  } else {
    console.log('not agreed');
    res.redirect('/eula');
  }
});

module.exports = router;
