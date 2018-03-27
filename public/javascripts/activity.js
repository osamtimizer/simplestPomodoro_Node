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

const CANVAS_TYPES = {
  bar: 'bar',
  line: 'line'
};

//chart obj must be here otherwise drawing of chart will have some issues.
let myChart;

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


          return parseResult(result, startDate, endDate);

        }).then((parsedResult) => {
          refreshCanvas(parsedResult.labels, parsedResult.data, CANVAS_TYPES.bar);
        }).catch((err) => {
          console.error(err);
        });
    }
  });

  //event handlers
  $('input[type="date"]').on("change", (event) => {
    //TODO:refresh canvas
    let duration;
    const targetDate = moment($('input[type="date"]').val());
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;

      switch($("button#duration").text()) {
          case "Duration:Week":
            duration = DURATIONS.week;
            break;
          case "Duration:Month":
            duration = DURATIONS.month;
            break;
          case "Duration:Year":
            duration = DURATIONS.year;
            break;
        default:
            duration = DURATIONS.week;
            break;
      }

      console.log("input date change event");
      console.log(uid);
      console.log(targetDate);
      console.log(duration);
      refreshActivityPage(uid, targetDate, duration).then(() => {
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  $("a#week").click((event) => {
    $("button#duration").text("Duration:Week");
    const targetDate = moment($('input[type="date"]').val());
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const duration = DURATIONS.week;
      const startDate = moment(targetDate - duration);
      const endDate = moment(targetDate + moment.duration(1, 'days'));

      fetchAppropriateActivity(user.uid, targetDate, duration)
        .then((result) => {
          console.log("return value from fetch method: ", result);
          return parseResult(result, startDate, endDate);

        }).then((parsedResult) => {
          refreshCanvas(parsedResult.labels, parsedResult.data, CANVAS_TYPES.bar);
        }).catch((err) => {
          console.error(err);
        });
    }
  });

  $("a#month").click((event) => {
    $("button#duration").text("Duration:Month");
    const targetDate = moment($('input[type="date"]').val());
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const duration = DURATIONS.month;
      refreshActivityPage(uid, targetDate, duration).then(() => {
        //nothing todo
        console.log("refresh activity");
      }).catch((err) => {
        console.error(err);
      });
      /*
      const startDate = moment(targetDate - duration);
      const endDate = moment(targetDate + moment.duration(1, 'days'));

      fetchAppropriateActivity(user.uid, targetDate, duration)
        .then((result) => {
          console.log("return value from fetch method: ", result);
          return parseResult(result, startDate, endDate);

        }).then((parsedResult) => {
          refreshCanvas(parsedResult.labels, parsedResult.data, CANVAS_TYPES.line);
        }).catch((err) => {
          console.error(err);
        });
        */
    }
  });
  $("a#year").click((event) => {
    $("button#duration").text("Duration:Year");
    const targetDate = moment($('input[type="date"]').val());
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const duration = DURATIONS.year;
      const startDate = moment(targetDate - duration);
      const endDate = moment(targetDate + moment.duration(1, 'days'));

      fetchAppropriateActivity(user.uid, targetDate, duration)
        .then((result) => {
          console.log("return value from fetch method: ", result);
          return parseResult(result, startDate, endDate);

        }).then((parsedResult) => {
          refreshCanvas(parsedResult.labels, parsedResult.data, CANVAS_TYPES.line);
        }).catch((err) => {
          console.error(err);
        });
    }
  });
});

const refreshActivityPage = (uid, targetDate, duration) => {
  return new Promise((resolve, reject) => {
    console.log("refreshActivityPage");
    const startDate = moment(targetDate - duration);
    const endDate = moment(targetDate + moment.duration(1, 'days'));
    const chartType = duration === DURATIONS.year ? CANVAS_TYPES.line : CANVAS_TYPES.bar;
    fetchAppropriateActivity(uid, targetDate, duration)
      .then((result) => {
        console.log("return value from fetch method: ", result);
        return parseResult(result, startDate, endDate);

      }).then((parsedResult) => {
        refreshCanvas(parsedResult.labels, parsedResult.data, chartType);
      }).catch((err) => {
        console.error(err);
      });
  });
}

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

const refreshCanvas = (labels, data, canvas_type) => {
  const context = $('#myChart')[0].getContext('2d');
  if (myChart) {
    myChart.destroy();
  }

  //draw chart
  //If you want to add graph on the canvas, add item to "datasets"

  myChart = new Chart(context, {
    type: canvas_type,
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

  return new Promise((resolve, reject) => {
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

    resolve(parsedResult);

  });
}
