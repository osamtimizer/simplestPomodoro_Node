const admin = require('firebase-admin');
const serviceAccount = require('./.simplestpomodoro.json');

const myFirebase_admin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  authDomain: 'simplestpomodoro.firebaseapp.com',
  databaseURL: 'simplestpomodoro.firebaseio.com'
});

module.exports = myFirebase_admin;
