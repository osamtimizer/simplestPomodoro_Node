import $ from 'jquery';
import Q from 'q';
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

const CANVAS_COLORS = [
  'rgba(231, 76, 60,1.0)',
  'rgba(46, 204, 113,1.0)',
  'rgba(52, 152, 219,1.0)',
  'rgba(155, 89, 182,1.0)',
  'rgba(241, 196, 15,1.0)'
];


let tasks;
let currentTask;

//chart obj must be here otherwise drawing of chart will have some issues.
let myChart;

$(() => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      const uid = user.uid;
      const today = moment();
      const min = moment(today - DURATIONS.year);
      $('input[type="date"]').val(today.format(DATE_YMD_FORMAT));
      $('input[type="date"]').attr('max', today.format(DATE_YMD_FORMAT));
      $('input[type="date"]').attr('min', min.format(DATE_YMD_FORMAT));

      let promises = [fetchCurrentTask(uid), fetchAllTasks(uid)];
      Promise.all(promises)
        .then((results) => {
          currentTask = results[0];
          tasks = results[1];
        }).then(() => {
          buildSelectPicker();
        }).then(() => {
          refreshActivityPage(uid, today, DURATIONS.week);
        }).catch((err) => {
          console.error(err);
        });
    }
  });

  //event handlers

  $('input[type="date"]').on('keydown', (event) => {
    return false;
  });

  $('div.bs-searchbox').on('keydown', (event) => {
    if(event.keyCode === 13) {
      event.stopPropagation();
      return false;
    }
  });


  $('input[type="date"]').on("change", (event) => {
    console.log("input date change event");
    let duration;
    const targetDate = moment($('input[type="date"]').val());
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      duration = getCurrentDuration();
      refreshActivityPage(uid, targetDate, duration);
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

      refreshActivityPage(uid, targetDate, duration);
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
      refreshActivityPage(uid, targetDate, duration);
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
      refreshActivityPage(uid, targetDate, duration)
    }
  });

  $("select.selectpicker").on('change', (event) => {
    //just my opinion: bootstrap plugin shouldn't be customized because this make project much complicated.
    console.log("selectpicker changed");
    const targetDate = moment($('input[type="date"]').val());
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const duration = getCurrentDuration();

      refreshActivityPage(uid, targetDate, duration);
    }
  });

});

const buildSelectPicker = () => {
  let options = [];
  for (let item in tasks) {
    const task = tasks[item];
    const template = String.raw`<option class="task selected" value="${task}" data-tokens="${task}">${task}</option>`;
    options.push(template);
  }
  $(".selectpicker").html(options);
  $(".selectpicker").val([currentTask]);
  $(".selectpicker").selectpicker('refresh');
}

//Promise
const fetchAllTasks = (uid) => {
  return new Promise((resolve, reject) => {
    const tasksRef = database.ref('users/' + uid + '/tasks');
    tasksRef.once('value').then((snapshot) => {
      console.log("refresh tasks");
      const fetchedTasks = snapshot.val();
      resolve(fetchedTasks);
    }).catch((err) => {
      reject(err);
    });
  });
}

//Promise
const fetchCurrentTask = (uid) => {
  return new Promise((resolve, reject) => {
    const ref = database.ref('users/' + uid + '/pomodoro');
    ref.once('value').then((snapshot) => {
      const fetchedTask = snapshot.child('currentTask').val();
      resolve(fetchedTask);
    }).catch((err) => {
      reject(err);
    });
  });
}

//TODO: refreshActivityPage must accept tasks as input value or fetch somehow to render them.
const refreshActivityPage = (uid, targetDate, duration) => {
  console.log("refreshActivityPage");
  //const startDate = moment(targetDate - duration);
  //const endDate = moment(targetDate + DURATIONS.day);

  //const chartType = duration === DURATIONS.year ? CANVAS_TYPES.line : CANVAS_TYPES.bar;
  const chartType = CANVAS_TYPES.bar;


  //TODO:fetch selected tasks from selectpicker
  let selectedTasks = [];

  $('select.selectpicker option:selected').each((index, selected) => {
    selectedTasks.push($(selected).text());
  });
  console.log("SelectedTasks: ", selectedTasks);
  Promise.all(selectedTasks.map((task) => {
    console.log("Promise.all");
    return fetchAppropriateActivity(uid, targetDate, duration, task);
  })).then((results) => {
    console.log("results from fetchAppropriateActivity: ", results);
    return results.map((result) => {
      console.log("Promise.all parseResult");
      return parseResult(result.activity, targetDate, duration, result.task);
    });
  }).then((parsedResults) => {
    refreshCanvas(parsedResults, chartType);
  }).catch((err) => {
    console.error(err);
  });
}

const fetchAppropriateActivity = (uid, targetDate, duration, taskName) => {
  return new Promise((resolve, reject) => {
    console.log("fetchAppropriateActivity");
    let activities = {
      task: taskName,
      activity: []
    };

//NEW OPERATION
    const migrateRef = database.ref('/users/' + uid + '/result/' + taskname);
    migrateRef.once("value").then((snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const date = childSnapshot.key;
        const count = childSnapshot.val();
        const result = {
          date: date,
          count: count
        };
        console.log("New operation: result: ", result);
        //activities.activity.push(result);
      });
    }).catch((err) => {
      console.error(err);
    });
//NEW OPERATION END

//OLD OPERATION
    //TODO:subordination of node should be uid->result->task->date...
    const ref = database.ref('users/' + uid + '/result');
    const days = duration.days();

    const startDate = moment(targetDate - duration);

    console.log("EndDate: ", targetDate.format(DATE_YMD_FORMAT));
    console.log("StartDate: ", startDate.format(DATE_YMD_FORMAT));

    ref.once("value").then((snapshot) => {
      console.log(snapshot);
      //if the day fetched from DB is in the duration, then add to array
      //TODO:This snapshot.forEach should iterate each task, not date.

      snapshot.forEach((childSnapshot) => {

        const date = childSnapshot.key;
        const count = childSnapshot.val()[taskName] || 0;
        //if the date is between startDate and endDate, then push this.
        console.log("date: ", date);
        console.log("taskCount: ", count);
        const fetchedDate = moment(date);
        //TODO:This operation can be replaced as limit queries.
        if ( startDate <= fetchedDate <= targetDate) {
          const result = {
            date: date,
            count: count
          };
          activities.activity.push(result);
        }
      });
//OLD OPERATION END


    }).then(() => {
      console.log("activities: ", activities);
      resolve(activities);
    }).catch((err) => {
      console.error(err);
      reject(err);
    });
  });
}

const parseResult = (result, targetDate, duration, taskName) => {
  console.log("parseResult result: ", result);
  console.log("parseResult targetDate: ", targetDate);
  console.log("parseResult task: ", taskName);
  let labels = [];
  let data = [];
  let parsedResult;

  const startDate = moment(targetDate - duration);
  const endDate = moment(targetDate + DURATIONS.day);

  let isBefore = startDate.isBefore(endDate);

  const template = String.raw`startDate: ${startDate} endDate${endDate} startDate.isBefore: ${isBefore}`;
  console.log(template);

  for(let index = startDate; index.isBefore(endDate); index.add(1, 'days')) {
    console.log("parseResult: index:", index.format(DATE_YMD_FORMAT));
    labels.push(index.format(DATE_YMD_FORMAT));

    let isFound = false;
    result.forEach((item) => {
      if (index.format(DATE_YMD_FORMAT) === item.date) {
        data.push(item.count);
        isFound = true;
      }
    });
    if (!isFound) {
      data.push(0);
    }

  }

  parsedResult = {
    labels: labels,
    data: data,
    task: taskName
  };

  console.log("Result of parsedResult", parsedResult);
  return parsedResult;

}

//TODO:Limit of data must be up to 5 or 10...
const refreshCanvas = (results, canvas_type) => {
  console.log("refreshCanvas");
  console.log("input value results: ", results);
  const context = $('#myChart')[0].getContext('2d');
  if (myChart) {
    myChart.destroy();
  }

  const labels = results[0].labels;
  let datasets = [];
  for(let index in results) {
    console.log("each index:", results[index]);
    datasets.push({
      label: results[index].task,
      data: results[index].data,
      backgroundColor: CANVAS_COLORS[index]
    });
  }

  //draw chart
  //If you want to add graph on the canvas, add item to "datasets"

  myChart = new Chart(context, {
    type: canvas_type,
    data: {
      labels: labels,
      datasets: datasets
    }
  });
}

const getCurrentDuration = () => {
  let duration;
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

  return duration;
}
