import firebase from 'firebase';

let config = {
  apiKey: "AIzaSyDUBdU1s_1ff_yUxXvlCbS9y4JyocdaShk",
  authDomain: "simplestpomodoro.firebaseapp.com",
  databaseURL: "https://simplestpomodoro.firebaseio.com",
  storageBucket: "simplestpomodoro.appspot.com",
};
firebase.initializeApp(config);

$(() => {
  $("input#agree-checkbox").change((event) => {
    console.log("Checkbox status changed");
    const prop = $(event.currentTarget).prop('checked');
    if (prop) {
      $("button#submit-eula").prop("disabled", false);
    } else {
      $("button#submit-eula").prop("disabled", true);
    }
  });

  $("button#submit-eula").on('click', (event) => {
    location.href = '/register';
  });
});
