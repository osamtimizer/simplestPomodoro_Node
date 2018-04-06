import $ from 'jquery';

$(() => {
  $("a.register").on('click', (event) => {
    location.href='/register';
  });
});
