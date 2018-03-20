const express = require('express');
const router = express.Router();

const admin = require('../firebase_init');

const auth = admin.auth();
const database = admin.database();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send("GET");
});

router.get('/:userId', (req, res, next) => {
  res.redirect("/login");
});

//caution: Promise operation must be chained.

//TODO:This route is based on REST API, but userId isn't required because this request has token, it means that Server can identify the user accessing here.
//TODO:Or, some validation filter/middleware should be written in app.js
router.post('/:userId', (req, res) => {
  //fetch user info from DB
  //Token is required from Client.
  //Uid might not be mandatory...?
  //const uid = req.body.uid;
  const token = req.body.token;
  const userId = req.params.userId;

  if ( token === undefined) {
    res.redirect("login");
  }
  else {

  //validate Token from firebase.
  console.log('Token from client:"' + token + '"');
  auth.verifyIdToken(token)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      //TODO: decodedToken.exp should be evaluated.

      database.ref('users/' + uid).once('value')
        .then((snapshot) => {
          const userId_db = snapshot.child('userId').val();
          const displayName = snapshot.child('displayName').val();
          res.render('users', {username: displayName});
        }).catch((err) => {
          console.error("Error: ", err);
        });
    }).catch((err) => {
      console.error("Error: ", err);
      res.render("login");
    });
  }

});

//Add new user
router.post('/', (req, res, next) => {
  const uid = req.body.uid;
  const token = req.body.token;

  console.log("Users POST");

  //uidが存在しなければthrow eとなる
  let count = 0;
  auth.getUser(uid)
    .then((userRecord) => {
      //既に登録されていたらメインページにリダイレクトしてやる
      console.log("uid: ", userRecord.uid);
      console.log("providerId: ", userRecord.providerData[0].providerId);

      database.ref('users').once('value')
        .then((snapshot) => {
          if (snapshot.hasChild(uid)) {
            console.log("user found");
            //307 means POST redirect
            console.log("Token from client:", token);
            res.redirect(307, "users/" + snapshot.child(uid + '/userId').val());
          } else {
            console.log(typeof(count));
            count = snapshot.child('userCount').child('count').val();
            console.log("Count: ", count);
            console.log(typeof(count));

            //tokenは毎回server->firebase adminで確認しに行けばいいので格納しなくて良い
            database.ref('users/' + userRecord.uid).set({
              userId: count,
              displayName: userRecord.displayName,
              email: userRecord.email,
              providerId: userRecord.providerData[0].providerId,
            });

            const updated_count = count + 1;
            database.ref('users/userCount').set({
              count: updated_count
            });

            res.redirect(307, '/users/' + count);
          }
        }).catch((err) => {
          console.error("Error: ", err);
        });

    });
});

module.exports = router;
