import firebase from 'firebase';
import confirmDialog from './confirmDialog'

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
    renderList();
    fadeOutLoadingImage();
  });

  //event handlers
  $("button#addTask").on('click', async(event) => {
    //validate input
    const taskName = $("input#addTaskName").val();
    console.log(taskName);
    if (taskName.length >= 20) {
      return;
    } else if (!task.match(/\S/g)) {
      return;
    }
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const ref = database.ref('users/' + uid + '/tasks/');
      const result = await ref.once("value");
      if (result.hasChild(taskName)) {
        console.log("task is already added");
      } else {
        const ref = database.ref('users/' + uid + '/tasks/' + taskName);
        ref.set("")
          .then(() => {
            renderList();
          }).catch((err) => {
            console.error(err);
          });
      }
    }
  });

  $("div.list-group#task-list").on('click', 'a.task', (event) => {
    const task = $(event.currentTarget).text();
    console.log(task);
    //TODO: Show specific information of task as modal dialog.
  });

  $("div.list-group#task-list").on('click', 'a span.close', (event) => {
    event.stopPropagation();
    const task = $(event.currentTarget).parent().text();
    const content = "Do you sure want to delete this task?";
    confirmDialog(content, () => {
      console.log("OK Clicked");
      renderList();
    });
    //TODO: Render list
  });

  $("div.list-group#task-list").on('click', 'a span.tag', (event) => {
    event.stopPropagation();
    console.log("tag clicked");
  });

});

const renderList = async() => {
  $("div.list-group#task-list").empty();
  const result = await fetchLatestTasks();
  for (let item in result) {
    console.log(item);
    const task = item;
    const tags = result[item];
    let tags_html = "";
    for (let tag of tags) {
      const template = String.raw`<span class="tag label label-info tag-list">${tag}</span>`;
      tags_html = tags_html.concat(template);
    }
    const template = String.raw`<a href="#" class="task list-group-item ${task}">${task}${tags_html}<span class="fui-cross close"></span></a>`;
    $("div.list-group#task-list").append(template);
  }
}

const fetchLatestTasks = async () => {
  const user = auth.currentUser;
  let tasks;
  if (user) {
    const uid = user.uid;
    tasks = (await database.ref('users/' + uid + '/tasks').once('value')).val();
  } else {
    tasks = [];
  }
  return tasks;
}


const fadeOutLoadingImage = () => {
  console.log("fadeOutLoadingImage is called");
  $('#loader-bg').delay(900).fadeOut(300);
  $('#loader').delay(600).fadeOut(300);
  $('div.wrap').delay(300).fadeIn(300);
  $('div#header-home').delay(300).fadeIn(300);
}
