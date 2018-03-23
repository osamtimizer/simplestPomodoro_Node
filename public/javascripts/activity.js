import $ from 'jquery';
import firebase from 'firebase';
import Chart from 'chart.js'
import moment from 'moment'

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
  auth.onAuthStateChanged((user) => {
    if (user) {
      const uid = user.uid;
      console.log(uid);
      const today = moment().format("YYYY-MM-DD");
      const one_week = moment.duration(1, 'weeks');
      const activity = fetchAppropriateActivity(user.uid, today, one_week);
    }
  });


  //draw chart
  const context = $('#myChart')[0].getContext('2d');
  const myChart = new Chart(context, {
    type: 'bar',
    data: {
      labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      datasets: [{
        label: 'apples',
        data: [12, 19, 3, 17, 6, 3, 7],
        backgroundColor: 'rgba(153,255,51,0,4)'
      }, {
        label: 'oranges',
        data: [2, 29, 5, 5, 2, 3, 10],
        backgroundColor: 'rgba(255,153,0,0,4)'
      }]
    }
  });
});

const fetchAppropriateActivity = (uid, targetDate, duration) => {
  let activities = [];
  const ref = database.ref('users/' + uid + '/result');
  const days = duration.days();
  console.log("fetchAppropriateActivity");
  ref.once("value").then((snapshot) => {
    console.log(snapshot);
    //if the day fetched from DB is in the duration, then add to array
    snapshot.forEach((childSnapshot) => {
      const date = childSnapshot.key;
      const count = childSnapshot.val().count;
      console.log(count);
    });
    console.log(activities);
  }).catch((err) => {
  });
}
