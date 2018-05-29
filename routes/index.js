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
  if(req.session.user) {
    res.render('help', {
      user: true
    });
  } else{
    res.render('help');
  }
});

router.get('/terms-of-use', (req, res, next) => {
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

router.post('/terms-of-use', (req, res, next) => {
  if (req.body.agreed === 'true') {
    req.session.agreement = { agreed: true };
    res.redirect('/signup');
  } else {
    console.log('not agreed');
    res.redirect('/terms-of-use');
  }
});

module.exports = router;
