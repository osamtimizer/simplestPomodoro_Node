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

const DATE_YMD_FORMAT = "YYYY-MM-DD";
const DURATIONS = {
  week: moment.duration(6, 'days'),
  month: moment.duration(30, 'days'),
  year: moment.duration(365, 'days')
};

$(() => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      const uid = user.uid;
      console.log(uid);
      const today = moment();
      $('input[type="date"]').val(today.format(DATE_YMD_FORMAT));
      const one_week = moment.duration(6, 'days');
      const startDate = moment(today - one_week);
      const endDate = moment(today + moment.duration(1, 'days'));
      fetchAppropriateActivity(user.uid, today, one_week)
        .then((result) => {
          console.log("return value from fetch method: ", result);

          //TODO: this method should be async
          //const parsedResult = parseResult(result, startDate, endDate);

          let labels = [];
          let data = [];

          for(var i = startDate; i.isBefore(endDate); i.add(1, 'days')) {
            console.log(i.format(DATE_YMD_FORMAT));
            labels.push(i.format(DATE_YMD_FORMAT));

            let isFound = false;
            result.forEach((item) => {
              if (i.format(DATE_YMD_FORMAT) === item.date) {
                data.push(item.count);
                isFound = true;
              }
            });
            if (!isFound) {
              data.push(0);
            }
          }


          //draw chart
          //If you want to add graph on the canvas, just add item to "datasets"

          refreshCanvas(labels, data);
        }).catch((err) => {
          console.error(err);
        });
    }
  });

  //event handlers
  $('input[type="date"]').on("change", (event) => {
    console.log("VALUE CHANGED");
    //TODO:refresh canvas
  });
  $("a#week").click((event) => {
    $("button#duration").text("Duration:Week");
    const targetDate = moment($('input[type="date"]').val());
    const user = auth.getCurrentUser();
    if (user) {
      const uid = user.uid;
    }
  });

  $("a#month").click((event) => {
    $("button#duration").text("Duration:Month");
  });
  $("a#year").click((event) => {
    $("button#duration").text("Duration:Year");
  });

});

const fetchAppropriateActivity = (uid, targetDate, duration) => {
  return new Promise((resolve, reject) => {
    console.log("fetchAppropriateActivity");
    let activities = [];
    const ref = database.ref('users/' + uid + '/result');
    const days = duration.days();

    const startDate = moment(targetDate - duration);

    console.log("EndDate: ", targetDate.format(DATE_YMD_FORMAT));
    console.log("StartDate: ", startDate.format(DATE_YMD_FORMAT));

    ref.once("value").then((snapshot) => {
      console.log(snapshot);
      //if the day fetched from DB is in the duration, then add to array
      snapshot.forEach((childSnapshot) => {
        const date = childSnapshot.key;
        const count = childSnapshot.val().count;
        //if the date is between startDate and endDate, then push this.
        console.log("date: ", date);
        console.log("count:", count);
        const fetchedDate = moment(date);
        if ( startDate <= fetchedDate <= targetDate) {
          const result = {
            date: date,
            count: count
          };
          activities.push(result);
        }
      });
    }).then(() => {
      console.log(activities);
      resolve(activities);
    }).catch((err) => {
      console.error(err);
      reject(err);
    });
  });
}

const refreshCanvas = (labels, data) => {
  const context = $('#myChart')[0].getContext('2d');
  const myChart = new Chart(context, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'activity',
        data: data,
        backgroundColor: 'rgba(153,255,51,0.4)'
      }]
    }
  });
}

const parseResult = (result, startDate, endDate) => {

  let labels = [];
  let data = [];
  let parsedResult;
  console.log("result: ", result);


  for(var i = startDate; i.isBefore(endDate); i.add(1, 'days')) {
    console.log("parseResult: i:", i.format(DATE_YMD_FORMAT));
    labels.push(i.format(DATE_YMD_FORMAT));

    let isFound = false;
    result.forEach((item) => {
      if (i.format(DATE_YMD_FORMAT) === item.date) {
        data.push(item.count);
        isFound = true;
      }
    });
    if (!isFound) {
      data.push(0);
    }

    parsedResult = {
      labels: labels,
      data: data
    };
  }

  return parsedResult;
}
