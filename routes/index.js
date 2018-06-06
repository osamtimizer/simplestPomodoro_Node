const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  if (req.session.user !== undefined) {
    res.redirect('/home');
  } else {
    next();
  }
},(req, res, next) => {
  res.render('index', { title: 'SimplestPomodoro' });
});

router.get('/privacy-policy', (req, res, next) => {
  if(req.session.user !== undefined) {
    res.render('privacy_policy', {
      title: "プライバシーポリシー",
      user: true
    });
  } else{
    res.render('privacy_policy');
  }
});

router.get('/terms-of-use', (req, res, next) => {
  if(req.session.user !== undefined) {
    res.render('terms_of_use', {
      title: "利用規約",
      user: true
    });
  } else{
    res.render('terms_of_use');
  }
});

router.get('/help', (req, res, next) => {
  if(req.session.user !== undefined) {
    res.render('help', {
      title: "ヘルプ",
      user: true
    });
  } else{
    res.render('help');
  }
});

router.get('/eula', (req, res, next) => {
  if (req.session.agreement) {
    res.redirect('/signup');
  } else if (req.session.user !== undefined) {
    res.redirect('/home');
  } else {
    next();
  }
},(req, res, next) => {
  res.render('eula.pug', { title: "利用規約" });
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
