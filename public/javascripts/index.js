$(() => {
  $("a.signup").on('click', (event) => {
    location.href='/signup';
  });
  $("button#login").on('click', (event) => {
    location.href='/login';
  });
});
