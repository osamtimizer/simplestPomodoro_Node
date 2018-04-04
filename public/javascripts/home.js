import $ from 'jquery';
import firebase from 'firebase';
import moment from 'Moment';
import 'jquery-confirm';

let config = {
  apiKey: "AIzaSyDUBdU1s_1ff_yUxXvlCbS9y4JyocdaShk",
  authDomain: "simplestpomodoro.firebaseapp.com",
  databaseURL: "https://simplestpomodoro.firebaseio.com",
  storageBucket: "simplestpomodoro.appspot.com",
};
firebase.initializeApp(config);

const auth = firebase.auth();
const database = firebase.database();

//CONSTANTS
const BREAK_TERM = false;
const WORKING_TERM = true;
const INITIAL_TERM_COUNT = 4;
const MIN_MS = 60 * 1000;
const WORKING_DURATION_MIN = 25;
const BREAK_SMALL_DURATION_MIN = 5;
const BREAK_LARGE_DURATION_MIN = 30;
const ONE_SEC_MS = 1000;
const INITIAL_TASK_NAME = "Work";

let timerStatus = false;
let isWorking = true;
let terms = INITIAL_TERM_COUNT;
let remain = WORKING_DURATION_MIN * MIN_MS;
let currentTask = INITIAL_TASK_NAME;
let timer;
let tasks;

$(() => {

  const window_height = $(window).height();
  $('#loader-bg , #loader').height(window_height).css('display', 'block');
  setTimeout(fadeOutLoadingImage, 10000);

  auth.onAuthStateChanged((user) => {
    console.log("onAuthStateChanged is called");
    if (user) {
      console.log("user is logged in");
      const ref = database.ref('users/' + user.uid);
      $("button.start").prop("disabled", false);
      $("button.stop").prop("disabled", true);
      ref.once("value").then((snapshot) => {
        //init pomodoro timer
        if (snapshot.hasChild('pomodoro')) {
          remain = snapshot.child('pomodoro').child('remain').val();
          terms = snapshot.child('pomodoro').child('terms').val();
          isWorking = snapshot.child('pomodoro').child('isWorking').val();
          currentTask = snapshot.child('pomodoro').child('currentTask').val();
          console.log(currentTask);
          refreshTimer();
        } else {
          //create pomodoro node
          database.ref('users/' + user.uid + '/pomodoro').set({
            remain: remain,
            terms: terms,
            isWorking: isWorking,
            currentTask: currentTask
          });
          refreshTimer();
        }

        if (snapshot.hasChild('tasks')) {
          console.log("tasks found");
          const fetchedTasks = snapshot.child('tasks').val();
          tasks = fetchedTasks;
          console.log("Fetched tasks: ", tasks);
        } else {
          console.log("create tasks on DB");
          tasks = [
            "Work",
            "MyTask",
            "Private"
          ];

          database.ref('users/' + user.uid + '/tasks').set({
            0: "Work",
            1: "MyTask",
            2: "Private",
          });
          console.log("no personal tasks.Pushed tasks: ", tasks);
        }
      }).then(() => {
        refreshTask();
        fadeOutLoadingImage();
      }).catch((err) => {
        console.error("Error: ", err);
      });
    } else {
      //nothing to do
    }
  });

  //event handlers
  $("button.start").click((event) => {
    timerStatus = true;
    timer = setInterval(startCount, 1000);
    refreshButtonview();
  });

  $("button.stop").click((event) => {
    timerStatus = false;
    clearInterval(timer);
    refreshDBPomodoroStatus();
    refreshButtonview();
  });

  $("button.reset").click((event) => {
    timerStatus = false;
    clearInterval(timer);

    //reset timer and send init value to realtimeDB
    const content = "Do you sure want to reset this timer?";
    confirmDialog(content, () => {
      resetTimer();
      refreshTimer();
      refreshDBPomodoroStatus();
    });

    refreshButtonview();
  });

  $("input#newTask").on('click.bs.dropdown.data-api', (event) => {
    event.stopPropagation();
  });

  $("input#newTask").on('keydown', (event) => {
    if(event.keyCode === 13) {
      console.log("Enter pushed");
      addNewTaskEventHandler(event);
    }
  });
  $("button#submitNewTask").on('click.bs.dropdown.data-api', addNewTaskEventHandler);


  $("ul.dropdown-menu").on("click", "li.task a.task span.close.task", (event) => {
    console.log("span.close.task is clicked");

    const content = "Do you sure want to delete this task?";
    confirmDialog(content, () => {
      console.log(event.currentTarget);
      const selectedTask = $(event.currentTarget).parent().text().slice(0, -1);
      console.log(selectedTask);
      //TODO:Change current task
      if (selectedTask === currentTask) {
        console.log("Warning: This task is currently selected.");
      } else {
        const index = tasks.indexOf(selectedTask);
        if (index >= 0) {
          $(event.currentTarget).parent().remove();
          deleteSpecifiedTask(selectedTask);
          tasks.splice(index, 1);
          refreshTask();
        }
      }
    });

    event.stopPropagation();
  });

  //Usage: This expression provides function to watch elements added dinamically.
  $("ul.dropdown-menu").on("click", "a.task", (event) => {
    console.log("a.task called");

    let targetTask = $(event.currentTarget).text();
    if ( targetTask !== currentTask) {
      console.log("targetTask", targetTask);
      console.log("currentTask", currentTask);
      targetTask = targetTask.slice(0, -1);
    }
    const escaped = $('<span />').text(targetTask).html();
    console.log("escaped text: ", escaped);
    currentTask = escaped;
    $("button#task").html(currentTask + '<span class="caret"/>');
    //TODO:Show alert and Reset Timer
    refreshTask();
    //push currentTask to realtimeDB
    refreshDBPomodoroStatus();
  });

  $(window).on('beforeunload', (event) => {
    if (timerStatus) {
      refreshDBPomodoroStatus();
    }
  });

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


});

//
//Methods
//

const fadeOutLoadingImage = () => {
  console.log("fadeOutLoadingImage is called");
  $('#loader-bg').delay(900).fadeOut(300);
  $('#loader').delay(600).fadeOut(300);
  $('div#main').delay(300).fadeIn(300);
  $('div#header-home').delay(300).fadeIn(300);
}

const startCount = () => {
  if (remain <= 0) {
    //Toggle Working<->Break
    isWorking = !isWorking;
    if (isWorking) {
      remain = WORKING_DURATION_MIN * MIN_MS;
      refreshTimer();
      refreshDBPomodoroStatus();
      return;

    } else {
      if (terms === 0) {
        //Have a long break
        remain = BREAK_LARGE_DURATION_MIN * MIN_MS;
        terms = INITIAL_TERM_COUNT;
      } else {
        remain = BREAK_SMALL_DURATION_MIN * MIN_MS;
        terms -= 1;
      }

      refreshTimer();
      refreshDBPomodoroStatus();
      addPomodoroResult();
      return;
    }
  }

  remain -= ONE_SEC_MS * 100;

  if (isWorking) {
    $("title").text("Working: " + moment(remain).format("mm:ss"));
  } else {
    $("title").text("Break: " + moment(remain).format("mm:ss"));
  }
  refreshTimer();
};

const addNewTaskEventHandler = (event) => {
  event.stopPropagation();
  //HINT: task names should be managed as json or some other good type, not li items.
  const task = $("input#newTask").val();
  if (task.length >= 20) {
    //TODO:Show Alert
    console.log("Warning: Task name must be less than 20.");
  }
  else if (!task.match(/\S/g)) {
    //TODO:Show Alert
    console.log("Warning: Task name must be some string, not empty");
  }
  else if(tasks.indexOf(task) >= 0 ) {
    //task already exists.
    //TODO:Show Alert
    console.log("Warning: Task name already exists.");
  } else {
    const escaped = $('<span />').text(task).html();
    tasks.push(escaped);
    refreshTask();
    $("input#newTask").val("");
  }
}

const refreshDBPomodoroStatus = () => {
  console.log("refreshDBPomodoroStatus");
  const user = auth.currentUser;
  if (user) {
    const pomodoroRef = database.ref('users/' + user.uid +'/pomodoro/');
    pomodoroRef.update({
      remain: remain,
      terms: terms,
      isWorking: isWorking,
      currentTask: currentTask
    });
  } else {
    //nothing todo
  }
}

const deleteSpecifiedTask = (task) => {
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    const ref = database.ref('users/' + uid + '/result/' + task);
    ref.remove();
  }
}

const confirmDialog = (content, okCallback, cancelCallback) => {
  if (okCallback === null) {
    okCallback = () => {
      console.log("Default okCallback");
    };
  }
  if (cancelCallback === null) {
    cancelCallback = () => {
      console.log("Default cancelCallback");
    };
  }

  $.confirm({
    title: "Caution",
    content: content,
    type: 'green',
    buttons: {
      ok: {
        text: 'ok',
        btnClass: 'btn-primary',
        keys: ['enter'],
        action: okCallback
      },
      cancel: {
        text: 'cancel',
        btnClass: 'btn-default',
        action: cancelCallback
      }
    }
  });
}

const addPomodoroResult = () => {
  console.log("addPomodoroResult");
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    //const date = new Date().toISOString().slice(0, -14);
    const date = moment().format("YYYY-MM-DD");
    //NEW OPERATION
    const resultCurrentTaskRef = database.ref('users/' + uid + '/result/' + currentTask);
    const migrateResultRef = database.ref('users/' + uid + '/result');
    migrateResultRef.once("value").then((snapshot) => {
      if (snapshot.hasChild(currentTask) &&
        snapshot.child(currentTask).hasChild(date)) {
        const count = snapshot.child(currentTask).child(date).val();
        const updated_count = count + 1;
        resultCurrentTaskRef.update({
          [date]: updated_count
        });
      } else {
        resultCurrentTaskRef.update({
          [date]: 1
        });
      }
    }).catch((err) => {
      console.error(err);
    });
    //NEW OPERATION END
  }
}

const refreshTask = () => {
  console.log("refreshTask");
  //Remove All Tasks
  $("li.task").remove();
  //Add Registered Tasks
  for (let item in tasks) {
    const task = tasks[item];
    let template;
    if ( task === currentTask) {
      template = String.raw`<li class="task"><a href="#" class="dropdown-item task currentTask" id="${task}">${task}</a></li>`;
    } else {
      template = String.raw`<li class="task"><a href="#" class="dropdown-item task" id="${task}">${task}<span type="button" class="close task">&times;</span></a></li>`;
    }
    $("ul.dropdown-menu").prepend(template);
  }

  console.log("refreshTask: tasks:", tasks);
  console.log("refreshTask: currentTask:", currentTask);
  if (tasks.indexOf(currentTask) >= 0) {
    console.log(currentTask);
    const escaped = $('<span />').text(currentTask).html();
    console.log("escaped: ", escaped);
    $("button#task").html(escaped + '<span class="caret"/>');
  } else {
    console.log("No task matched in tasks");
  }

  updateDBTasks();
}

const updateDBTasks = () => {
  console.log("updateDBTasks");
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    database.ref('users/' + uid + '/tasks').set(tasks);
  }
}

const resetTimer = () => {
  isWorking = true;
  terms = INITIAL_TERM_COUNT;
  remain = WORKING_DURATION_MIN * MIN_MS;
}

const refreshTimer = () => {
  const time = moment(remain).format("mm:ss");
  //$("p.time").text(new Date(remain).toISOString().slice(14, -5));
  $("p.time").text(time);
  $("p.term").text("Term: " + terms.toString());
  if (isWorking) {
    $("p.currentStatus").text("Status: Working");
  } else {
    $("p.currentStatus").text("Status: Break");
  }

}

const refreshButtonview = () => {
  if (timerStatus) {
    $("button.start").prop("disabled", true);
    $("button.start").removeClass("btn-primary");
    $("button.start").addClass("btn-default");
    $("button.stop").prop("disabled", false);
    $("button.stop").removeClass("btn-default");
    $("button.stop").addClass("btn-primary");
  } else {
    $("button.start").prop("disabled", false);
    $("button.start").removeClass("btn-default");
    $("button.start").addClass("btn-primary");
    $("button.stop").prop("disabled", true);
    $("button.stop").removeClass("btn-primary");
    $("button.stop").addClass("btn-default");
  }
}
