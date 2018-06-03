import firebase from 'firebase';
import moment from 'moment';
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
const DEFAULT_TERM_COUNT = 4;
const INITIAL_TERM_LIMIT_UPPER = 9;
const INITIAL_TERM_LIMIT_LOWER = 1;
const MIN_MS = 60 * 1000;
const WORKING_DURATION_MIN = 25;
const WORKING_DURATION_MS = WORKING_DURATION_MIN * MIN_MS;
const BREAK_SMALL_DURATION_MIN = 5;
const BREAK_SMALL_DURATION_MS = BREAK_SMALL_DURATION_MIN * MIN_MS;
const BREAK_LARGE_DURATION_MIN = 30;
const BREAK_LARGE_DURATION_MS = BREAK_LARGE_DURATION_MIN * MIN_MS;
const ONE_SEC_MS = 1000;
const INITIAL_TASK_NAME = "Work";

let timerStatus = false;
let isWorking = true;
let introduction_finish = false;
let initialTerm = DEFAULT_TERM_COUNT;
let terms = 0;
let remain = WORKING_DURATION_MIN * MIN_MS;
let currentTask = INITIAL_TASK_NAME;
let timer;
let tasks;

$(() => {

  $('[data-toggle="popover"]').popover();
  const window_height = $(window).height();
  $('#loader-bg , #loader').height(window_height).css('display', 'block');
  setTimeout(fadeOutLoadingImage, 10000);

  auth.onAuthStateChanged((user) => {
    console.log("onAuthStateChanged is called");
    if (user) {
      const uid = user.uid;
      console.log("user is logged in");
      const ref = database.ref('users/' + uid);
      $("button.start").prop("disabled", false);
      $("button.stop").prop("disabled", true);
      ref.once("value").then((snapshot) => {
        //init pomodoro timer
        if (snapshot.hasChild('pomodoro')) {
          remain = snapshot.child('pomodoro').child('remain').val();
          terms = snapshot.child('pomodoro').child('terms').val();
          initialTerm = snapshot.child('pomodoro').child('initialTerm').val();
          introduction_finish = snapshot.child('pomodoro').child('introduction_finish').val();
          isWorking = snapshot.child('pomodoro').child('isWorking').val();
          currentTask = snapshot.child('pomodoro').child('currentTask').val();
          console.log(currentTask);
          refreshTimer();
        } else {
          //create pomodoro node
          database.ref('users/' + uid + '/pomodoro').set({
            remain: remain,
            terms: terms,
            initialTerm: DEFAULT_TERM_COUNT,
            introduction_finish: introduction_finish,
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
          tasks = {
            "Work": "",
            "MyTask": "",
            "Private": ""
          };

          database.ref('users/' + uid + '/tasks').set(tasks);
          database.ref('users/' + uid + '/tags').set('');
          database.ref('users/' + uid + '/results').set('');
        }
      }).then(() => {
        buildSelectPicker();
        refreshBackgroundColor();
        initTagsinput();
        initSlider();
        refreshSlider();
        refreshTags();
        fadeOutLoadingImage();
      }).then(() => {

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
    const content = "タイマーの状態をリセットしますか?";
    confirmDialog(content, () => {
      reset();
    });

    refreshButtonview();
    refreshSlider();
  });

  $("div.popover").on('click', (event) => {
    $('input[data-toggle="popover"]').popover('hide');
  });

  $("input#newTask").on('keydown', (event) => {
    if(event.keyCode === 13) {
      console.log("Enter pushed");
      addNewTaskEventHandler(event);
      //TODO:Rebuild Selectpicker
    } else {
      $('input[data-toggle="popover"]').popover('hide');
    }
  });

  $("button#submitNewTask").on('click', (event) => {
    if ($("input#newTask").attr('type') === 'hidden') {
      $("input#newTask").attr('type', '');
    } else {
      addNewTaskEventHandler(event);
    }
  });

  //TODO:Add event handlers for selectpicker

  $(window).on('beforeunload', (event) => {
    if (timerStatus) {
      refreshDBPomodoroStatus();
    }
  });

  //tagsinput event handlers
  $("input.tagsinput").on('beforeItemAdd', (event) => {
  });
  $("input.tagsinput").on('itemAdded', (event) => {
    console.log("input.tagsinput itemAdded");
    //validate tag
    //TODO:sanitize input text
    const inputTags = $(event.currentTarget).tagsinput('items');
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const ref = database.ref('users/' + uid + '/tasks/' + currentTask);
      ref.set(inputTags);
    }
    updateDBTags();
  });

  $("input.tagsinput").on('beforeItemRemove', (event) => {
  });

  $("input.tagsinput").on('itemRemoved', (event) => {
    let inputTags = $(event.currentTarget).tagsinput('items');
    if (inputTags.length === 0) {
      inputTags = "";
    }
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const ref = database.ref('users/' + uid + '/tasks/' + currentTask);
      ref.set(inputTags).then(() => {
        updateDBTags();
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  $("select.selectpicker").on('change', (event) => {
    console.log("selectpicker changed");
    const selectedTask = $(event.target).children("option:selected").text();
    console.log("selectedTask", selectedTask);
    console.log("currentTask", currentTask);
    currentTask = selectedTask;
    buildSelectPicker();
    refreshTags();
    refreshDBPomodoroStatus();

    const content = "タイマーの状態をリセットしますか?";
    confirmDialog(content,() => {
      reset();
    });

  });

  $("div.newTask").on('click', 'div.popover div.arrow div.popover-content', (event) => {
    console.log('test');
    $('input[data-toggle="popover"]').popover('hide');
  });

  $(document).on('click', (event) => {
    if(!$(event.target).closest('div.popover-content').length) {
      $('input[data-toggle="popover"]').popover('hide');
    } else {
      console.log(event.target);
    }
  });

  $("span.term").on('click', 'span.fui-arrow-left', async(event) => {
    const user = auth.currentUser;
    if (user) {
      console.log("fui-arrow-left clicked");
      const uid = user.uid;
      const uri = 'users/' + uid + '/pomodoro/initialTerm';
      const snapshot = (await database.ref(uri).once('value'));
      const newInitialTerm = snapshot.val() - 1;
      if (newInitialTerm >= INITIAL_TERM_LIMIT_LOWER && newInitialTerm >= terms) {
        database.ref(uri).set(newInitialTerm).then(() => {
          const template = `Pomodoro: ${terms.toString()} /<span class="fui-arrow-left"/> ${newInitialTerm.toString()} <span class="fui-arrow-right"/>`;
          $("span.term").html(template);
          initialTerm = newInitialTerm;
        }).then(() => {
          refreshSpanArrow();
        }).catch((err) => {
          console.error(err);
        });
      }
    }
  });

  $("span.term").on('click', 'span.fui-arrow-right', async(event) => {
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const uri = 'users/' + uid + '/pomodoro/initialTerm';
      const snapshot = (await database.ref(uri).once('value'));
      const newInitialTerm = snapshot.val() + 1;
      if (newInitialTerm <= INITIAL_TERM_LIMIT_UPPER) {
        database.ref(uri).set(newInitialTerm).then(() => {
          const template = `Pomodoro: ${terms.toString()} /<span class="fui-arrow-left"/> ${newInitialTerm.toString()} <span class="fui-arrow-right"/>`;
          $("span.term").html(template);
          initialTerm = newInitialTerm;
        }).then(() => {
          refreshSpanArrow();
        }).catch((err) => {
          console.error(err);
        });
      }
    }
  });

  $("span.term").on('mouseenter', 'span.fui-arrow-left', (event) => {
    if (initialTerm > INITIAL_TERM_LIMIT_LOWER && initialTerm > terms) {
      $(event.target).css("cursor", "pointer");
      $(event.target).css("color", "red");
    }
  });

  $("span.term").on('mouseleave', 'span.fui-arrow-left', (event) => {
    refreshSpanArrow();
  });

  $("span.term").on('mouseenter', 'span.fui-arrow-right', (event) => {
    if (initialTerm < INITIAL_TERM_LIMIT_UPPER) {
      $(event.target).css("cursor", "pointer");
      $(event.target).css("color", "red");
    }
  });

  $("span.term").on('mouseleave', 'span.fui-arrow-right', (event) => {
    refreshSpanArrow();
  });

});

//
//Methods
//


const refreshHeader = () => {
  if (timerStatus) {
    if (isWorking) {
      $("nav.navbar-custom").css("background-color", "#E84B3C");
    } else {
      $("nav.navbar-custom").css("background-color", "#1C8BE2");
    }
  } else {
    $("nav.navbar-custom").css("background-color", "#34485E");
  }
}

const fadeOutLoadingImage = () => {
  console.log("fadeOutLoadingImage is called");
  $('#loader-bg').fadeOut(300);
  $('#loader').fadeOut(300);
  $('div.wrap').fadeIn(300);
  $('div#header-home').fadeIn(300);
}

const refreshBackgroundColor = () => {
  if (isWorking) {
    $("body").css("background-color", "rgba(255,0,0,0.1)");
  } else {
    $("body").css("background-color", "rgba(28,139,226,0.1)");
  }
}

const startCount = () => {
  if (remain <= 0) {
    //Toggle Working<->Break
    isWorking = !isWorking;
    refreshBackgroundColor();
    if (isWorking) {
      remain = WORKING_DURATION_MIN * MIN_MS;
      if (terms === initialTerm) {
        terms = 0;
      } else {
        terms = initialTerm;
      }
      refreshTimer();
      refreshDBPomodoroStatus();
      initSlider();
      return;

    } else {
      if (terms === initialTerm) {
        //Have a long break
        console.log("terms:", terms);
        console.log("initialTerm:", initialTerm);
        console.log("long break");
        console.log(BREAK_LARGE_DURATION_MIN);
        remain = BREAK_LARGE_DURATION_MS;
      } else {
        console.log("terms:", terms);
        console.log("initialTerm:", initialTerm);
        remain = BREAK_SMALL_DURATION_MIN * MIN_MS;
      }

      refreshTimer();
      refreshDBPomodoroStatus();
      addPomodoroResult();
      initSlider();
      return;
    }
  }

  remain -= ONE_SEC_MS * 10;
  const remain_display = remain > 0 ? remain : 0;
  if (isWorking) {
    $("title").text("Working: " + moment(remain_display).format("mm:ss"));
  } else {
    $("title").text("Break: " + moment(remain_display).format("mm:ss"));
  }
  refreshTimer();
  initSlider();
};

const refreshSlider = () => {
  if (isWorking) {
    const style_width =  (remain / WORKING_DURATION_MS) * 100;
    const template_slider = String.raw`left: ${style_width}%`;
    $("a.ui-slider-handle").attr("style",template_slider);
    $("div.ui-slider-range").css("background", "#E84B3C");
  } else {
    $("div.ui-slider-range").css("background", "#1C8BE2");
    if (terms === initialTerm) {
      const style_width =  (remain / BREAK_LARGE_DURATION_MS) * 100;
      const template_slider = String.raw`left: ${style_width}%`;
      $("a.ui-slider-handle").attr("style",template_slider);
    } else {
      const style_width =  (remain / BREAK_SMALL_DURATION_MS) * 100;
      const template_slider = String.raw`left: ${style_width}%`;
      $("a.ui-slider-handle").attr("style",template_slider);
    }
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
    title: "タイマーのリセット",
    content: content,
    type: 'green',
    buttons: {
      ok: {
        text: 'Yes',
        btnClass: 'btn-primary',
        keys: ['enter'],
        action: okCallback
      },
      cancel: {
        text: 'No',
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


const fetchDBTasks = () => {
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    const ref = database.ref('users/' + uid + '/tasks/');
    ref.once("value").then((snapshot) => {
      console.log("tasks found");
      const fetchedTasks = snapshot.val();
      tasks = fetchedTasks;
      console.log("Fetched tasks: ", tasks);
    }).catch((err) => {
      console.error("Error: ", err);
    });
  }

}

const refreshTags = () => {
  console.log("refreshTags");
  $("input.tagsinput").tagsinput('removeAll');
  //fetch tags of currentTask
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    const ref = database.ref('users/' + uid + '/tasks/' + currentTask);
    ref.once('value').then((snapshot) => {
      return snapshot.val();
    }).then((tags) => {
      console.log("tags:", tags);
      if (typeof(tags) === 'string') {
        $("input.tagsinput").tagsinput('add', tags);
        $("input.tagsinput").tagsinput('refresh');
      } else {
        for (let item in tags) {
          $("input.tagsinput").tagsinput('add', tags[item]);
        }
        $("input.tagsinput").tagsinput('refresh');
      }
    }).catch((err) => {
      console.error(err);
    });
  }
}

const updateDBTasks = () => {
  console.log("updateDBTasks");
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    database.ref('users/' + uid + '/tasks').set(tasks);
  }
}

const updateDBTags = () => {
  console.log("updateDBTags");
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    const ref = database.ref('users/' + uid + '/tasks');
    let tags = [];
    ref.once("value").then((snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const fetchedTags = childSnapshot.val();
        console.log("taskName:", childSnapshot.key);
        console.log("fetchedTags:", fetchedTags);
        for (let item in fetchedTags) {
          if ( tags.indexOf(fetchedTags[item]) < 0) {
            tags.push(fetchedTags[item]);
          }
        }
      });
      console.log("tags:", tags);
    }).then(() => {
      const sortedTags = tags.slice().sort();
      console.log(sortedTags);
      const tagsRef = database.ref('users/' + uid + '/tags');
      tagsRef.set(sortedTags);
    }).catch((err) => {
      console.error(err);
    });
  }
}

const resetTimer = () => {
  isWorking = true;
  terms = 0;
  remain = WORKING_DURATION_MIN * MIN_MS;
}

const refreshTimer = () => {
  const time = moment(remain).format("mm:ss");
  $("p.time").text(time);
  console.log(typeof(initialTerm));
  const template = `Pomodoro: ${terms.toString()} /<span class="fui-arrow-left"/> ${initialTerm.toString()} <span class="fui-arrow-right"/>`;
  $("span.term").html(template);
  if (isWorking) {
    $("p.currentStatus").text("Status: Working");
  } else {
    $("p.currentStatus").text("Status: Break");
  }
  refreshSlider();
  refreshButtonview();
  refreshSpanArrow();
}

const refreshSpanArrow = () => {
  if (terms < initialTerm) {
    $("span.fui-arrow-left").css("color", "rgb(25,188,155)");
  } else {
    $("span.fui-arrow-left").css("color", "gray");
  }

  if (initialTerm < INITIAL_TERM_LIMIT_UPPER) {
    $("span.fui-arrow-right").css("color", "rgb(25,188,155)");
  } else {
    $("span.fui-arrow-right").css("color", "gray");
  }
};

const refreshButtonview = () => {
  if (timerStatus) {
    $("button.start").prop("disabled", true);
    $("button.start").removeClass("btn-inverse");
    $("button.start").addClass("btn-default");
    $("button.stop").prop("disabled", false);
    $("button.stop").removeClass("btn-default");
    $("button.stop").addClass("btn-inverse");
  } else {
    $("button.start").prop("disabled", false);
    $("button.start").removeClass("btn-default");
    $("button.start").addClass("btn-inverse");
    $("button.stop").prop("disabled", true);
    $("button.stop").removeClass("btn-inverse");
    $("button.stop").addClass("btn-default");
  }
  refreshHeader();
}

const buildSelectPicker = () => {
  console.log("buildSelectPicker");
  let options = [];
  for (let item in tasks) {
    const task = item;
    const template = String.raw`<option class="task selected" value="${task}" data-tokens="${task}">${task}</option>`;
    options.push(template);
  }

  $(".selectpicker").html("");
  $(".selectpicker").html(options);
  $(".selectpicker").val([currentTask]);
  $(".selectpicker").selectpicker('refresh');
}

const initTagsinput = () => {
  console.log("buildTagsinput");
  $("input.tagsinput").tagsinput({
    maxTags: 5,
    allowDuplicates: false,
    maxChars: 20
  });
}

const initSlider = () => {
  let max;
  console.log("terms:initSlider:", terms);
  if (isWorking) {
    max = WORKING_DURATION_MS;
  } else {
    if (terms === initialTerm) {
      max = BREAK_LARGE_DURATION_MS;
    } else {
      max = BREAK_SMALL_DURATION_MS;
    }
  }

  $("div.slider").slider({
    min: 0,
    max: max,
    value: remain,
    orientation: "horizonal",
    range: "min",
    change: (event, ui) => {
      remain = ui.value;
      refreshTimer();
    }
  });
}

const addNewTaskEventHandler = (event) => {
  console.log('addNewTaskEventHandler');
  event.stopPropagation();
  const task = $("input#newTask").val();
  if (task.length >= 20) {
    const warning = "タスク名は20文字以内で入力して下さい。";
    $('input[data-toggle="popover"]').attr("data-content", warning);
    $('input[data-toggle="popover"]').popover('show');
  }
  else if (!task.match(/\S/g)) {
    const warning = "空白以外の文字を入力して下さい。";
    $('input[data-toggle="popover"]').attr("data-content", warning);
    $('input[data-toggle="popover"]').popover('show');
  }
  else {
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      console.log(uid);
      const ref = database.ref('users/' + uid + '/tasks/');
      let exists = false;
      ref.once('value').then((snapshot) => {
        console.log("snapshot:", snapshot);
        snapshot.forEach((childSnapshot) => {
          if (task === childSnapshot.key) {
            exists = true;
          }
        });
      }).then(() => {
        if (exists) {
          const warning = "このタスク名はすでに登録されています。";
          $('input[data-toggle="popover"]').attr("data-content", warning);
          $('input[data-toggle="popover"]').popover('show');
        } else {
          const ref = database.ref('users/' + uid + '/tasks/' + task);
          ref.set("");
          tasks[task] = "";
          const success = `${task} が追加されました`;
          $('input[data-toggle="popover"]').attr("data-content", success);
          $('input[data-toggle="popover"]').popover('show');
          $('input#newTask').val('');
        }
      }).then(() => {
        buildSelectPicker();
      }).catch((err) => {
        console.error(err);
      });
    }
  }
}

const reset = () => {
  resetTimer();
  refreshTimer();
  initSlider();
  refreshDBPomodoroStatus();
  refreshBackgroundColor();
}

$.fn.addSliderSegments = function (amount, orientation) {
  return this.each(function () {
    if (orientation == "vertical") {
      var output = ''
        , i;
      for (i = 1; i <= amount - 2; i++) {
        output += '<div class="ui-slider-segment" style="top:' + 100 / (amount - 1) * i + '%;"></div>';
      };
      $(this).prepend(output);
    } else {
      var segmentGap = 100 / (amount - 1) + "%"
        , segment = '<div class="ui-slider-segment" style="margin-left: ' + segmentGap + ';"></div>';
      $(this).prepend(segment.repeat(amount - 2));
    }
  });
};

