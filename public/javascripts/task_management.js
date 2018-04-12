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
        let json = {
          key: childSnapshot.key,
          value: childSnapshot.val()
        }
        tasks.push(json);
      });
    }).then(() => {
      for(const index in tasks) {
        console.log(tasks[index]);
        let tags = tasks[index]["value"];
        console.log("tags:", tags);
        let tags_html = "";
        for (const tag of tags) {
          const template = String.raw`<span class="tag label label-info tag-list">${tag}</span>`;
          tags_html = tags_html.concat(template);
        }
        console.log(tags_html);
        const template = String.raw`<a href="#" class="task list-group-item ${tasks[index]["key"]}">${tasks[index]["key"]}${tags_html}<span class="fui-cross close"></span></a>`;
        $("div.list-group#task-list").append(template);
      }
    }).then((result) => {
      fadeOutLoadingImage();
    }).catch((err) => {
      console.error(err);
    });
  });

  //event handlers
  $("div.list-group#task-list").on('click', 'a.task', (event) => {
    const task = $(event.currentTarget).text();
    console.log(task);
    //TODO: Show specific information of task as modal dialog.
  });

  $("div.list-group#task-list").on('click', 'a.span.close', (event) => {
    const task = $(event.currentTarget).parent().text();
    //TODO: Show confirm dialog and delete task
    //TODO: Render list
  });
});

const fadeOutLoadingImage = () => {
  console.log("fadeOutLoadingImage is called");
  $('#loader-bg').delay(900).fadeOut(300);
  $('#loader').delay(600).fadeOut(300);
  $('div.wrap').delay(300).fadeIn(300);
  $('div#header-home').delay(300).fadeIn(300);
}
