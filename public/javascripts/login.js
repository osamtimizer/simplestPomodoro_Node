import $ from 'jquery';
import firebase from 'firebase';

let config = {
  apiKey: "AIzaSyDUBdU1s_1ff_yUxXvlCbS9y4JyocdaShk",
  authDomain: "simplestpomodoro.firebaseapp.com",
  databaseURL: "https://simplestpomodoro.firebaseio.com",
  storageBucket: "simplestpomodoro.appspot.com",
};
firebase.initializeApp(config);
const auth = firebase.auth();

$(() => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      //redirect to user page
      user.getIdToken(/* forceRefresh */ true).then((idToken) => {
        startAuth(idToken);
      }).catch((err) => {
        console.error("Error: ", err);
      });
    }
  });

  $("button#auth").click((event) => {
    console.log("Button clicked");
    let provider = new firebase.auth.GoogleAuthProvider();
    console.log("start auth");
    firebase.auth().signInWithPopup(provider).then((result) => {
      //using token, start registration
      //TODO:This token is acccessToken, Server requires another token.
      const token = result.credential.accessToken;
      const user = result.user;
      const uid = user.uid;
      console.log(token);
      //Tokenをfirebaseに確認、一致したら正しいログインとみなす
      //main pageにリダイレクト

      //startLogin(uid, token);
    });
  });

  $("button#login").click((event) => {
    console.log("Login clicked");
    auth.currentUser.getIdToken(true)
      .then((idToken) => {
        startAuth(idToken);
      }).catch((err) => {
        console.error("Error: ", err);
      });
  });
});

const startAuth = (token) => {
  let form = document.createElement('form');
  form.method = 'POST';
  form.action = '/login';

  let input_token = document.createElement('input');
  input_token.setAttribute('type', 'hidden');
  input_token.setAttribute('name', 'token');
  input_token.setAttribute('value', token);
  form.appendChild(input_token);

  document.body.appendChild(form);

  form.submit();
}

const startLogin = (uid, token) => {

  let form = document.createElement('form');
  form.method = 'POST';
  form.action = '/users';

  let input_uid = document.createElement('input');
  input_uid.setAttribute('type', 'hidden');
  input_uid.setAttribute('name', 'uid');
  input_uid.setAttribute('value', uid);
  form.appendChild(input_uid);

  let input_token = document.createElement('input');
  input_token.setAttribute('type', 'hidden');
  input_token.setAttribute('name', 'token');
  input_token.setAttribute('value', token);
  form.appendChild(input_token);

  document.body.appendChild(form);

  form.submit();
}

