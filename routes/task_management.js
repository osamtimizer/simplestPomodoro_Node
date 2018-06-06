const express = require('express');
const router = express.Router();

const admin = require('../firebase_init');
const auth = admin.auth();
const database = admin.database();

router.get('/', function(req, res, next) {

  if (req.session.user !== undefined) {
    res.render('task_management', {
      title: "Task Management",
      user: true
    });
  } else {
    res.redirect('login');
  }
});

module.exports = router;
