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
  $("input#newTask").on('keydown', (event) => {
    if(event.keyCode === 13) {
      console.log("Enter pushed");
      addNewTaskEventHandler(event);
    } else {
      $('input[data-toggle="popover"]').popover('hide');
    }
  });

  $("button#addTask").on('click', (event) => {
    //validate input
    addNewTaskEventHandler(event);
  });

  $("div.list-group#task-list").on('click', 'a.task', (event) => {
    const task = $(event.currentTarget).text();
    console.log(task);
    //TODO: Show specific information of task as modal dialog.
  });

  $("div.list-group#task-list").on('click', 'a span.close', (event) => {
    event.stopPropagation();
    const task = $(event.currentTarget).parent().attr("taskName");
    const content = "Do you sure want to delete this task?";
    confirmDialog(content, () => {
      console.log("OK Clicked");
      console.log(task);
      deleteSpecifiedTask(task);
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
    const task = item;
    const tags = result[item];
    let tags_html = "";
    for (let tag of tags) {
      const template = String.raw`<span class="tag label label-info tag-list">${tag}</span>`;
      tags_html = tags_html.concat(template);
    }
    const template = String.raw`<a href="#" class="task list-group-item ${task}" taskName="${task}">${task}${tags_html}<span class="fui-cross close"></span></a>`;
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

const addNewTaskEventHandler = async(event) => {
  const taskName = $("input#newTask").val();
  if (taskName.length >= 20) {
    const warning = "Warning: Length of task name must be less than 20.";
    $('input[data-toggle="popover"]').attr("data-content", warning);
    $('input[data-toggle="popover"]').popover('show');
    return;
  } else if (!taskName.match(/\S/g)) {
    const warning = "Warning: Task name must be some string, not empty";
    $('input[data-toggle="popover"]').attr("data-content", warning);
    $('input[data-toggle="popover"]').popover('show');
    return;
  }
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    const ref = database.ref('users/' + uid + '/tasks/');
    const result = await ref.once("value");
    if (result.hasChild(taskName)) {
      const warning = "Warning: Task name already exists";
      $('input[data-toggle="popover"]').attr("data-content", warning);
      $('input[data-toggle="popover"]').popover('show');
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
}

const deleteSpecifiedTask = async(task) => {
  console.log(task);
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    const resultRef = database.ref('users/' + uid + '/result/' + task);
    const taskRef = database.ref('users/' + uid + '/tasks/').child(task);
    console.log(taskRef);
    await resultRef.remove();
    await taskRef.remove();
  }
}

