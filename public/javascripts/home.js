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
  $("a#logout").click((event) => {
    console.log("logout")
    let user = auth.currentUser;
    if (user) {
      auth.signOut().then(() => {
        console.log("Sign out");
        //redirect
        location.href="/login";
      }).catch((err) => {
        console.error("Error: ", err);
      });
    } else {
      location.href="/login";
    }
  });

  //TODO:when user close the window, remain time should be sent to server...
  /*
  $(window).on('beforeunload', () => {
    return "test";
  });
  */
});
