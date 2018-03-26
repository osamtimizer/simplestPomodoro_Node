import $ from 'jquery';
import firebase from 'firebase';
import moment from 'Moment';

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

let timerStatus = false;
let isWorking = true;
let terms = INITIAL_TERM_COUNT;
let remain = WORKING_DURATION_MIN * MIN_MS;
let timer;

$(() => {
  auth.onAuthStateChanged((user) => {
    console.log("onAuthStateChanged is called");
    if (user) {
      console.log("user is logged in");
      const ref = database.ref('users/' + user.uid);
      $("button.start").prop("disabled", false);
      $("button.stop").prop("disabled", false);
      ref.once("value").then((snapshot) => {
        if (snapshot.hasChild('pomodoro')) {
          remain = snapshot.child('pomodoro').child('remain').val();
          terms = snapshot.child('pomodoro').child('terms').val();
          isWorking = snapshot.child('pomodoro').child('isWorking').val();
          refreshTimer();
        } else {
          //create pomodoro node
          database.ref('users/' + user.uid + '/pomodoro').set({
            remain: remain,
            terms: terms,
            isWorking: isWorking
          });
          refreshTimer();

        }
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
    refreshPomodoroStatus();
    refreshButtonview();
  });

  $("button.reset").click((event) => {
    timerStatus = false;
    clearInterval(timer);

    let result = confirm("Are you sure want to reset this timer?");
    if (result) {
      //reset timer and send init value to realtimeDB
      isWorking = true;
      terms = INITIAL_TERM_COUNT;
      remain = WORKING_DURATION_MIN * MIN_MS;
      refreshTimer();
      refreshPomodoroStatus();
    } else {
      //nothing to do
    }

    refreshButtonview();
  });

  $(window).on('beforeunload', (event) => {
    RefreshPomodoroStatus();
    return "Are you sure want to leave this page?";
  });

});

const startCount = () => {
  if (remain <= 0) {
    //Toggle Working<->Break
    isWorking = !isWorking;
    if (isWorking) {
      remain = WORKING_DURATION_MIN * MIN_MS;
      refreshTimer();
      refreshPomodoroStatus();
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
      refreshPomodoroStatus();
      addPomodoroResult();
      return;
    }
  }

  remain -= ONE_SEC_MS * 100;
  refreshTimer();
};

const refreshPomodoroStatus = () => {
  const user = auth.currentUser;
  if (user) {
    const pomodoroRef = database.ref('users/' + user.uid +'/pomodoro/');
    pomodoroRef.set({
      remain: remain,
      terms: terms,
      isWorking: isWorking
    });
  } else {
    //nothing todo
  }
}

const addPomodoroResult = () => {
  console.log("addPomodoroResult");
  const user = auth.currentUser;
  if (user) {
    //const date = new Date().toISOString().slice(0, -14);
    const date = moment().format("YYYY-MM-DD");
    const resultRef = database.ref('users/' + user.uid + '/result');
    resultRef.once("value").then((snapshot) => {
      if (snapshot.hasChild(date)) {
        console.log("snapshot has child");
        const count = snapshot.child(date).child('count').val();
        const updated_count = count + 1;
        const resultTodayRef = database.ref('users/' + user.uid + '/result/' + date);
        resultTodayRef.set({
          count: updated_count
        })
      } else {
        console.log("snapshot doesn't have child");
        const resultTodayRef = database.ref('users/' + user.uid + '/result/' + date);
        resultTodayRef.set({
          count: 1
        })
      }
    }).catch((err) => {
      console.error("Error: ", err);
    });

  }
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
    $("button.stop").removeClass("btn-default");
    $("button.stop").addClass("btn-primary");
  } else {
    $("button.start").prop("disabled", false);
    $("button.start").removeClass("btn-default");
    $("button.start").addClass("btn-primary");
    $("button.stop").removeClass("btn-primary");
    $("button.stop").addClass("btn-default");
  }
}
