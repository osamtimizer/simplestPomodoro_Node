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
    $(".alert").css("visibility", "visible")
      .animate({opacity:1}, 500);
  });
  $(".close").on('click', (event) => {
    console.log("close clicked");
    $(".alert").css("visibility", "hidden");
    return false;
  });
});
