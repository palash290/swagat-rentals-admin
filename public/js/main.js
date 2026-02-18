// $(window).on("load", function () {
//   setTimeout(function () {
//     $(".ct_loader_main").fadeOut();
//   }, 1500); 
// });

$(document).ready(function () {
  $(".ct_menu_bar").click(function () {
    $("main").addClass("ct_show");
  });

  $(".ct_close_sidebar").click(function () {
    $("main").removeClass("ct_show");
  });
});