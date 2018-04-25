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
  const user = auth.currentUser;
  if (user) {
    console.log("Signed out");
    user.signOut();
  }

  $("button.toLoginPage").click((event) => {
    location.href = "/login";
  });

});

