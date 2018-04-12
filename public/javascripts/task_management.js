import firebase from 'firebase';

let config = {
  apiKey: "AIzaSyDUBdU1s_1ff_yUxXvlCbS9y4JyocdaShk",
  authDomain: "simplestpomodoro.firebaseapp.com",
  databaseURL: "https://simplestpomodoro.firebaseio.com",
  storageBucket: "simplestpomodoro.appspot.com",
};
firebase.initializeApp(config);

const auth = firebase.auth();
const database = firebase.database();

$(() => {
  const window_height = $(window).height();
  $('#loader-bg , #loader').height(window_height).css('display', 'block');
  setTimeout(fadeOutLoadingImage, 1000);

  //fetch tasks
  auth.onAuthStateChanged((user) => {
    const uid = user.uid;
    const ref = database.ref('users/' + uid +'/tasks/');
    let tasks = [];
    ref.once('value').then((snapshot) => {
      snapshot.forEach((childSnapshot) => {
        console.log(childSnapshot.key);
        tasks.push(childSnapshot.key);
      });
    }).then(() => {
      for(const item of tasks) {
        const template = String.raw`<a href="#" class="list-group-item ${item}">${item}<span class="fui-cross close"></span></a>`;
        $("div.list-group#task-list").append(template);
      }
    }).then((result) => {
      fadeOutLoadingImage();
    }).catch((err) => {
      console.error(err);
    });
  });

});

const fadeOutLoadingImage = () => {
  console.log("fadeOutLoadingImage is called");
  $('#loader-bg').delay(900).fadeOut(300);
  $('#loader').delay(600).fadeOut(300);
  $('div.wrap').delay(300).fadeIn(300);
  $('div#header-home').delay(300).fadeIn(300);
}
