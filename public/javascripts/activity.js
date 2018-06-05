import Q from 'q';
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
  day: moment.duration(1, 'days'),
  week: moment.duration(6, 'days'),
  month: moment.duration(30, 'days'),
  year: moment.duration(365, 'days'),
  all: "All"
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
  const window_height = $(window).height();
  $('#loader-bg , #loader').height(window_height).css('display', 'block');
  setTimeout(fadeOutLoadingImage, 10000);

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
          fadeOutLoadingImage();
        }).catch((err) => {
          console.error(err);
        });
    } else {
      location.href = '/activity';
    }
  });

  //event handlers
  $('button#download').on('click', async(event) => {
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const ref = database.ref('users/' + uid + '/result');

      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      let content = "";
      content += "Task name,Date,Count\n";
      const snapshot = (await ref.once('value'));
      snapshot.forEach((childSnapshot) => {
        const taskName = childSnapshot.key;
        const val = childSnapshot.val();
        for (let item in val) {
          const date = item;
          const count = val[item];
          content += taskName + ',' + date + ',' + count + '\n';
        }
      });

      const link = document.createElement('a');
      const blob = new Blob([bom, content], {"type": "text/csv" });
      link.href = window.URL.createObjectURL(blob);
      link.download = user.displayName + '_' + moment().format('YYYY_MM_DD_HH_mm_ss') + '.csv';
      link.click();

    }
  });

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
      if (duration === "All") {
        return false;
      }
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

  $("a#all").click((event) => {
    console.log("duration change event: All");
    $("button#duration").text("Duration:All");
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      drawAllDuration(uid);
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

      if (duration === "All") {
        drawAllDuration(uid);
      } else {
        refreshActivityPage(uid, targetDate, duration);
      }
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
  $('div.wrap').delay(300).fadeIn(300);
  $('div#header-home').delay(300).fadeIn(300);
}

const drawAllDuration = async(uid) => {

  let tasks = [];
  let counts = [];

  let selectedTasks = [];
  $('select.selectpicker option:selected').each((index, selected) => {
    selectedTasks.push($(selected).text());
  });
  console.log("SelectedTasks:", selectedTasks);

  const snapshot = (await database.ref('users/' + uid + '/result').once('value'));
  snapshot.forEach((childSnapshot) => {
    const taskName = childSnapshot.key;
    const val = childSnapshot.val();
    let count = 0;
    for (let item in val) {
      count += val[item];
    }
    console.log(taskName);
    console.log(selectedTasks.indexOf(taskName));
    if (selectedTasks.indexOf(taskName) !== -1) {
      console.log("Task matched:", taskName);
      tasks.push(taskName);
      counts.push(count);
    }
  });

  refreshCanvasAllDuration(tasks, counts);
}

const refreshCanvasAllDuration = (tasks, counts) => {
  console.log("refreshCanvasAllDuration");
  const context = $('#myChart')[0].getContext('2d');
  if (myChart) {
    myChart.destroy();
  }

  const labels = tasks;
  const canvas_type = CANVAS_TYPES.bar;
  let datasets = [];
  let colors = [];

  for (let index in labels) {
    colors.push(CANVAS_COLORS[index]);
  }
  console.log("colors:", colors);

  datasets = [{
    label: 'tasks',
    backgroundColor: colors,
    data: counts,
  }];

  //draw chart
  //If you want to add graph on the canvas, add item to "datasets"

  console.log(datasets);
  myChart = new Chart(context, {
    type: canvas_type,
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true
            }
          }
        ]
      }
    }
  });

}

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
      let fetchedTasks = [];
      snapshot.forEach((childSnapshot) => {
        fetchedTasks.push(childSnapshot.key);
      });
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

const refreshActivityPage = (uid, targetDate, duration) => {
  console.log("refreshActivityPage");
  const chartType = CANVAS_TYPES.bar;


  let selectedTasks = [];

  $('select.selectpicker option:selected').each((index, selected) => {
    selectedTasks.push($(selected).text());
  });
  if (selectedTasks.length === 0) {
    return;
  }
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
    const ref = database.ref('users/' + uid + '/result');
    const days = duration.days();
    const startDate = moment(targetDate - duration);
    const migrateRef = database.ref('/users/' + uid + '/result/' + taskName);

    migrateRef.once("value").then((snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const date = childSnapshot.key;
        const count = childSnapshot.val();

        const fetchedDate = moment(date);
        const result = {
          date: date,
          count: count
        };
        console.log("New operation: result: ", result);
        if (startDate <= fetchedDate <= targetDate) {
          activities.activity.push(result);
        }
      });
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

  console.log(datasets);
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
    case "Duration:All":
      duration = DURATIONS.all;
      break;
    default:
      duration = DURATIONS.week;
      break;
  }

  return duration;
}
