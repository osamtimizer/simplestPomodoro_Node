import firebase from 'firebase';
import confirmDialog from './confirmDialog'

let config = {
  apiKey: "AIzaSyDUBdU1s_1ff_yUxXvlCbS9y4JyocdaShk",
  authDomain: "simplestpomodoro.firebaseapp.com",
  databaseURL: "https://simplestpomodoro.firebaseio.com",
  storageBucket: "simplestpomodoro.appspot.com",
};
firebase.initializeApp(config);

const auth = firebase.auth();
const database = firebase.database();
const modal = $('[data-remodal-id=modal]').remodal();
const modal_delete = $('[data-remodal-id=modal-delete]').remodal();

let currentTask;
let selectedTask;
let isRenderingModal = false;

$(() => {
  const window_height = $(window).height();
  $('#loader-bg , #loader').height(window_height * 2).css('display', 'block');
  setTimeout(fadeOutLoadingImage, 1000);

  //fetch tasks
  auth.onAuthStateChanged(async (user) => {
    if (user) {
    const uid = user.uid;
    const ref = database.ref('users/' + uid + '/pomodoro/currentTask');
    currentTask = (await ref.once('value')).val();
    console.log("currentTask:", currentTask);
    renderList();
    } else {
      location.href = "/login";
    }
  });
  fadeOutLoadingImage();
  initTagsinput();

  //initialization for FlatUI elem
  $('.input-group').on('focus', 'form-control', function() {
    $(this).closest('.input-group, input-group-btn').addClass('focus');
  }).on('blur', '.form-control', function() {
    $(this).closest('.input-group, input-group-btn').removeClass('focus');
  });

  //event handlers
  $("input#newTask").on('keydown', (event) => {
    if(event.keyCode === 13) {
      console.log("Enter pushed");
      addNewTaskEventHandler(event);
    } else {
      $('input[data-toggle="popover"]').popover('hide');
    }
  });

  $("button#addTask").on('click', (event) => {
    if ($("input#newTask").attr('type') === 'hidden') {
      $("input#newTask").attr('type', '');
    } else {
      addNewTaskEventHandler(event);
    }
  });

  $("input#search-query").on('keyup', (event) => {
    const query = $("input#search-query").val().toUpperCase();
    console.log(query);
    filterList(query);
  });

  $("span#clear-search-query").on('click', (event) => {
    $("input#search-query").val('');
    const query = $("input#search-query").val().toUpperCase();
    console.log(query);
    filterList(query);
  });

  $(document).on('click', (event) => {
    if(!$(event.target).closest('div.popover-content').length) {
      $('input[data-toggle="popover"]').popover('hide');
    } else {
      console.log(event.target);
    }
  });

  //event handlers for dynamic elem
  $("div.list-group#task-list").on('click', 'a.task', (event) => {
    selectedTask = $(event.target).attr("taskName");
    console.log(selectedTask);
    modal.open();
  });

  $("div.list-group#task-list").on('click', 'a span.close', (event) => {
    event.stopPropagation();
    const task = $(event.target).parent().attr("taskName");
    const content = "Are you sure want to delete this task?";
    confirmDialog(content, () => {
      console.log("OK Clicked");
      console.log(task);
      deleteSpecifiedTask(task);
      renderList();
    });
  });

  $("div.list-group#task-list").on('click', 'a span.tag', (event) => {
    event.stopPropagation();
    console.log("tag clicked");
    $("input#search-query").val('');
    const query = $(event.currentTarget).text();
    filterListByTag(query.toUpperCase());
    $("input#search-query").val(query);
  });

  //event handlers for remodal elem
  $(document).on('confirmation', '.remodal-task', (event) => {
    console.log('confirmation button is clicked');
    console.log($(event.target));
  });

  $(document).on('opening', '.remodal-task', async(event) => {
    if (currentTask === selectedTask) {
      $("button#remodal-confirm").prop('disabled', true);
    } else {
      $("button#remodal-confirm").prop('disabled', false);
    }
    const user = auth.currentUser;
    if (user) {
      isRenderingModal = true;
      //$("input.tagsinput").off('itemAdded');
      //$("input.tagsinput").off('itemRemoved');
      console.log("opening");
      const uid = user.uid;
      const ref = database.ref('users/' + uid + '/tasks/' + selectedTask);
      let tags = (await ref.once('value')).val();
      console.log(tags);
      $("input.tagsinput").tagsinput('removeAll');
      for (let item of tags) {
        $("input.tagsinput").tagsinput('add', item);
      }
      $("h3#taskName").text(selectedTask);

      const resultRef = database.ref('users/' + uid + '/result/' + selectedTask);
      resultRef.once('value').then((snapshot) => {
        let result = 0;
        snapshot.forEach((childSnapshot) => {
          console.log("key:", childSnapshot.key);
          result += childSnapshot.val();
        });
        return result;
      }).then((result) => {
        console.log("result:", result);
        $("h4#count").text("Total Count:" + result.toString());
        isRenderingModal = false;
      }).catch((err) => {
      });

      //$("input.tagsinput").on('itemAdded', tagsinput_ItemAdded(event));
      //$("input.tagsinput").on('itemRemoved', tagsinput_ItemRemoved(event));
    }
  });

  $(document).on('closed', '.remodal-task', (event) => {
    isRenderingModal = true;
    $("input.tagsinput").tagsinput('removeAll');
    $("h3#taskName").text('');
    isRenderingModal = false;
  });

  $("button#remodal-confirm").on('click', (event) => {
    const user = auth.currentUser;
    if (user) {
      const uid= user.uid;
      const ref = database.ref('users/' + uid + '/pomodoro/currentTask');
      ref.set(selectedTask).then(() => {
        currentTask = selectedTask;
        renderList();
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  $("button#btn-deleteAll").on('click', (event) => {
    modal_delete.open();
  });

  $("button#btn-deleteAllTasks").on('click', async(event) => {
    $('input#confirmDeleteAllTasks').val('');
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const currentTaskRef = database.ref('users/' + uid + '/pomodoro/currentTask');
      const tasksRef = database.ref('users/' + uid + '/tasks/');
      const tagsRef = database.ref('users/' + uid + '/tags/');
      const resultRef = database.ref('users/' + uid + '/result/');

      await tagsRef.set("");
      await resultRef.set("");
      const defaultTask = {
        defaultTask: ""
      };
      tasksRef.set(defaultTask).then(() => {
        currentTaskRef.set("defaultTask");
      }).then(() => {
        return renderList();
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  $(document).on('opening', '.remodal-tasks-delete', (event) => {
      $("button#btn-deleteAllTasks").prop("disabled", true);
      $('input#confirmDeleteAllTasks').val('');
  });

  $("input#confirmDeleteAllTasks").on('keyup', (event) => {
    if ($('input#confirmDeleteAllTasks').val() === 'DeleteAllTasks') {
      $("button#btn-deleteAllTasks").prop("disabled", false);
    } else {
      $("button#btn-deleteAllTasks").prop("disabled", true);
    }
  });

  //event handlers for tagsinput

  $("input.tagsinput").on('beforeItemAdd', (event) => {});
  $("input.tagsinput").on('beforeItemRemove', (event) => {});

  $("input.tagsinput").on('itemAdded', (event) => {
    console.log("input.tagsinput itemAdded");
    if (isRenderingModal) {
      return false;
    }
    const inputTags = $("input.tagsinput").tagsinput('items');
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const ref = database.ref('users/' + uid + '/tasks/' + selectedTask);
      ref.set(inputTags);
    }
    updateDBTags();
    renderList();
  });
  $("input.tagsinput").on('itemRemoved', (event) => {
    console.log("itemRemoved");
    if (isRenderingModal) {
      return false;
    }
    let inputTags = $("input.tagsinput").tagsinput('items');
    if (inputTags.length === 0) {
      inputTags = "";
    }
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      const ref = database.ref('users/' + uid + '/tasks/' + selectedTask);
      ref.set(inputTags).then(() => {
        updateDBTags();
      }).catch((err) => {
        console.error(err);
      });
      renderList();
    }
  });
});

const tagsinput_ItemAdded = (event) => {
  console.log("input.tagsinput itemAdded");
  const inputTags = $("input.tagsinput").tagsinput('items');
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    const ref = database.ref('users/' + uid + '/tasks/' + selectedTask);
    ref.set(inputTags);
  }
  updateDBTags();
  renderList();
}

const tagsinput_ItemRemoved = (event) => {
  console.log("itemRemoved");
  let inputTags = $("input.tagsinput").tagsinput('items');
  if (inputTags.length === 0) {
    inputTags = "";
  }
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    const ref = database.ref('users/' + uid + '/tasks/' + selectedTask);
    ref.set(inputTags).then(() => {
      updateDBTags();
    }).catch((err) => {
      console.error(err);
    });
    renderList();
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

const renderList = async(query = '') => {
  $("input#search-query").val('');
  $("div.list-group#task-list").empty();
  let isSearching = true;
  if (query === '') {
    console.log("Query is empty");
    isSearching = false;
  }
  const result = await fetchLatestTasks();
  for (let item in result) {
    if (isSearching && !item.includes(query)) {
      continue;
    }
    const task = item;
    const tags = result[item];
    let tags_html = "";
    for (let tag of tags) {

      const template = String.raw`<span class="tag label label-info tag-list">${tag}</span>`;
      tags_html = tags_html.concat(template);
    }
    let template;
    if (task === currentTask) {
      template = String.raw`<a href="#" class="task list-group-item ${task}" taskName="${task}">${task}${tags_html}</a>`;
    } else {
      template = String.raw`<a href="#" class="task list-group-item ${task}" taskName="${task}">${task}${tags_html}<span class="fui-cross close"></span></a>`;
    }

    $("div.list-group#task-list").append(template);
  }
}

const fetchLatestTasks = async () => {
  const user = auth.currentUser;
  let tasks;
  if (user) {
    const uid = user.uid;
    tasks = (await database.ref('users/' + uid + '/tasks').once('value')).val();
  } else {
    tasks = [];
  }
  return tasks;
}

const fadeOutLoadingImage = () => {
  console.log("fadeOutLoadingImage is called");
  $('#loader-bg').delay(900).fadeOut(300);
  $('#loader').delay(600).fadeOut(300);
  $('div.wrap').delay(300).fadeIn(300);
  $('div#header-home').delay(300).fadeIn(300);
}

const addNewTaskEventHandler = async(event) => {
  const taskName = $("input#newTask").val();
  if (taskName.length >= 20) {
    const warning = "タスク名は20文字以内で入力して下さい。";
    console.log(warning);
    $('input[data-toggle="popover"]').attr("data-content", warning);
    $('input[data-toggle="popover"]').popover('show');
    return;
  } else if (!taskName.match(/\S/g)) {
    const warning = "空白以外の文字を入力して下さい。";
    $('input[data-toggle="popover"]').attr("data-content", warning);
    $('input[data-toggle="popover"]').popover('show');
    return;
  }
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    const ref = database.ref('users/' + uid + '/tasks/');
    const result = await ref.once("value");
    if (result.hasChild(taskName)) {
      const warning = "このタスク名はすでに登録されています。";
      $('input[data-toggle="popover"]').attr("data-content", warning);
      $('input[data-toggle="popover"]').popover('show');
    } else {
      const ref = database.ref('users/' + uid + '/tasks/' + taskName);
      ref.set("")
        .then(() => {
          renderList();
        }).catch((err) => {
          console.error(err);
        });
      const success = `${taskName} が追加されました`;
      $('input[data-toggle="popover"]').attr("data-content", success);
      $('input[data-toggle="popover"]').popover('show');
      $("input#newTask").val('');
    }
  }
}

const deleteSpecifiedTask = async(task) => {
  console.log(task);
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    const resultRef = database.ref('users/' + uid + '/result/' + task);
    const taskRef = database.ref('users/' + uid + '/tasks/').child(task);
    console.log(taskRef);
    await resultRef.remove();
    await taskRef.remove();
  }
}

const filterList = (query) => {
  const targetElements = $("div.list-group#task-list").children("a.task");

  for (let index = 0; index < targetElements.length; index++) {
    const taskName = $(targetElements[index]).attr("taskName").toUpperCase();
    let tagNames = [];
    $(targetElements[index]).find("span").each((i, elem) => {
      tagNames.push($(elem).text().toUpperCase());
    });
    console.log("tagNames:", tagNames);
    if (taskName.includes(query) || isPartialMatchArray(query, tagNames)){
      $(targetElements[index]).show();
    } else {
      $(targetElements[index]).hide();
    }
  }
}

const filterListByTag = (query) => {
  const targetElements = $("div.list-group#task-list").children("a.task");

  for (let index = 0; index < targetElements.length; index++) {
    let tagNames = [];
    $(targetElements[index]).find("span").each((i, elem) => {
      tagNames.push($(elem).text().toUpperCase());
    });
    console.log("tagNames:", tagNames);
    if (isPartialMatchArray(query, tagNames)){
      $(targetElements[index]).show();
    } else {
      $(targetElements[index]).hide();
    }
  }
}

const isPartialMatchArray = (query, targetArr) => {
  let result = false;
  console.log("query:", query);
  console.log("targetArr:", targetArr);
  for(let item of targetArr) {
    if (targetArr.includes(query)) {
      result = true;
    }
  }
  return result;
}

const initTagsinput = () => {
  console.log("buildTagsinput");
  $("input.tagsinput").tagsinput({
    maxTags: 5,
    allowDuplicates: false,
    maxChars: 20
  });
}
