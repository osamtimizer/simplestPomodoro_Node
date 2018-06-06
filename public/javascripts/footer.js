$(() => {
  const MINIMUM_HEIGHT = 500;
  $(window).resize(() => {
    if($(window).height() < MINIMUM_HEIGHT) {
      $("footer.footer").hide();
    } else {
      $("footer.footer").show();
    }
  });

});
