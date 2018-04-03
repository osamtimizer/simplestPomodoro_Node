const admin = require('firebase-admin');
//TODO:PRODUCTION:put simplestpomodoro.json file in the following path
const serviceAccount = require('./.simplestpomodoro.json');

const myFirebase_admin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  authDomain: 'simplestpomodoro.firebaseapp.com',
  databaseURL: 'simplestpomodoro.firebaseio.com'
});

module.exports = myFirebase_admin;
