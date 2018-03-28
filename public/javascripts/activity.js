import $ from 'jquery';
import firebase from 'firebase';
import Chart from 'chart.js'
import moment from 'moment'
import 'bootstrap-select';

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
  day: moment.duration(1, 'days'),
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
      const today = moment();
      $('input[type="date"]').val(today.format(DATE_YMD_FORMAT));
      const tasksRef = database.ref('users/' + uid + '/tasks');
      tasksRef.once('value').then((snapshot) => {
        console.log("refresh tasks");
        const tasks = snapshot.val();
        return tasks;
      }).then((tasks) => {
        buildSelectPicker(tasks);
      }).catch((err) => {
        console.error(err);
      });

      const ref = database.ref('users/' + uid + '/pomodoro');
      ref.once('value').then((snapshot) => {
        const currentTask = snapshot.child('currentTask').val();
        console.log(currentTask);
        const tasks = [currentTask];
        //TODO:Current task must be selected as default.
       return refreshActivityPage(uid, today, DURATIONS.week);
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  //event handlers
  $('input[type="date"]').on("change", (event) => {
    console.log("input date change event");
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
      refreshActivityPage(uid, targetDate, duration).then(() => {
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  $("a#week").click((event) => {
    console.log("duration change event: week");
    $("button#duration").text("Duration:Week");
    const targetDate = moment($('input[type="date"]').val());
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const duration = DURATIONS.week;

      refreshActivityPage(uid, targetDate, duration).then(() => {
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  $("a#month").click((event) => {
    console.log("duration change event: month");
    $("button#duration").text("Duration:Month");
    const targetDate = moment($('input[type="date"]').val());
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const duration = DURATIONS.month;
      refreshActivityPage(uid, targetDate, duration).then(() => {
        //nothing todo
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  $("a#year").click((event) => {
    console.log("duration change event: year");
    $("button#duration").text("Duration:Year");
    const targetDate = moment($('input[type="date"]').val());
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const duration = DURATIONS.year;
      refreshActivityPage(uid, targetDate, duration).then(() => {
        //nothing todo
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  $("select.selectpicker").on('change', (event) => {
    //just my opinion: bootstrap plugin shouldn't be customized because this make project much complicated.
    console.log("selectpicker changed");
    $('select.selectpicker option:selected').each((index, selected) => {
      console.log($(selected).text());
    });
  });

});

const buildSelectPicker = (tasks) => {
  let options = [];
  for (let item in tasks) {
    const task = tasks[item];
    const template = String.raw`<option class="task selected" value="${task}">${task}</option>`;
    options.push(template);
  }
  $(".selectpicker").html(options);
  $(".selectpicker").selectpicker('refresh');
}

//TODO: refreshActivityPage must accept tasks as input value or fetch somehow to render them.
const refreshActivityPage = (uid, targetDate, duration) => {
  return new Promise((resolve, reject) => {
    console.log("refreshActivityPage");
    const startDate = moment(targetDate - duration);
    const endDate = moment(targetDate + DURATIONS.day);
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
