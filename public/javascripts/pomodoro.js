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
const database= firebase.database();

//CONSTANTS
const BREAK_TERM = false;
const WORKING_TERM = true;
const INITIAL_TERM_COUNT = 4;
const MIN_MS = 60 * 1000;
const WORKING_DURATION_MIN = 25;
const BREAK_SMALL_DURATION_MIN = 5;
const BREAK_LARGE_DURATION_MIN = 30;
const ONE_SEC_MS = 1000;

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

  $("button.start").click((event) => {
    timer = setInterval(startCount, 1000);
    $("button.start").prop("disabled", true);
  });

  $("button.stop").click((event) => {
    $("button.start").prop("disabled", false);
    clearInterval(timer);
    refreshPomodoroStatus();
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
  auth.onAuthStateChanged((user) => {
    if (user) {
      const date = new Date().toISOString().slice(0, -14);
      const resultRef = database.ref('users/' + user.uid + '/result');
      resultRef.once("value").then((snapshot) => {
        if (snapshot.hasChild(date)) {
          const count = snapshot.child(date).child('count').val();
          const updated_count = count + 1;
          const resultTodayRef = database.ref('users/' + user.uid + '/result/' + date);
          resultTodayRef.set({
            count: updated_count
          })
        } else {
          const resultTodayRef = database.ref('users/' + user.uid + '/result/' + date);
          resultTodayRef.set({
            count: 1
          })
        }
      }).catch((err) => {
        console.error("Error: ", err);
      });

    }
  });
}

const refreshTimer = () => {
  $("p.time").text(new Date(remain).toISOString().slice(14, -5));
  $("p.term").text("Terms" + terms.toString());
  if (isWorking) {
    $("p.currentStatus").text("Status: Working");
  } else {
    $("p.currentStatus").text("Status: Break");
  }

}
