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
  $("button#submit").click((event) => {
    console.log("submit clicked");
    //TODO: use css.Display, fadein and fadeout
    $("div.alert").addClass('show');
    $("div.alert").removeClass('hide');
  });

  $("a.close").click((event) => {
    console.log("close clicked");
    $("div.alert").removeClass('show');
    $("div.alert").addClass('hide');
  });
});
