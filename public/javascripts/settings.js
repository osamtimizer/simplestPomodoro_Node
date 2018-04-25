import firebase from 'firebase';

let config = {
  apiKey: "AIzaSyDUBdU1s_1ff_yUxXvlCbS9y4JyocdaShk",
  authDomain: "simplestpomodoro.firebaseapp.com",
  databaseURL: "https://simplestpomodoro.firebaseio.com",
  storageBucket: "simplestpomodoro.appspot.com",
};
firebase.initializeApp(config);

const auth = firebase.auth();

$(() => {
  const modal_delete = $('[data-remodal-id=modal-delete]').remodal();

  $("button#delete-account").click((event) => {
    modal_delete.open();
  });

  $("button#btn-deleteAccount").on('click', async(event) => {
    const user = auth.currentUser;
    if (user) {
      user.getIdToken(true).then((idToken) => {
        execDelete(idToken);
      }).catch((err) => {
        console.error(err);
      });
    }
  });

  $(document).on('opening', '.remodal-tasks-delete', (event) => {
      $("button#btn-deleteAccount").prop("disabled", true);
      $('input#confirmDeleteAccount').val('');
  });

  $("input#confirmDeleteAccount").on('keyup', (event) => {
    if ($('input#confirmDeleteAccount').val() === 'DeleteAccount') {
      $("button#btn-deleteAccount").prop("disabled", false);
    } else {
      $("button#btn-deleteAccount").prop("disabled", true);
    }
  });
});

const execDelete = (token) => {
  let form = document.createElement('form');
  form.method = 'POST';
  form.action = '/users/delete';

  let input_token = document.createElement('input');
  input_token.setAttribute('type', 'hidden');
  input_token.setAttribute('name', 'token');
  input_token.setAttribute('value', token);
  form.appendChild(input_token);

  document.body.appendChild(form);

  form.submit();
}
