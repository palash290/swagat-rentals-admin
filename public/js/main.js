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

  $(".ct_approach_slider").owlCarousel({
    loop: true,
    margin: 20,
    nav: false,
    dots: false,
    autoWidth: true,
    responsive: {
      0: {
        items: 1,
        stagePadding: 0,
      },
      767: {
        items: 1,
        stagePadding: 0,
      },
      991: {
        items: 2,
      },
    },
  });

  $(".ct_next_btn").click(function () {
    $(".ct_approach_slider").trigger("next.owl.carousel");
  });

  $(".ct_prev_btn").click(function () {
    $(".ct_approach_slider").trigger("prev.owl.carousel");
  });
});