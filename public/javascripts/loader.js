$(() => {
  console.log("Loader is called");
  const window_height = $(window).height();
  $("div#wrap").css('display', 'none');
  $('#loader-bg , #loader').height(window_height).css('display', 'block');
});

$(window).on('load', () => {
  console.log("window.load is called");
  $('#loader-bg').delay(900).fadeOut(800);
  $('#loader').delay(600).fadeOut(300);
  $("div#wrap").css('display', 'block');
});

