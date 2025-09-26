/*-----------------------------------------------------------------------------------
/*
/* Init JS
/*
-----------------------------------------------------------------------------------*/

jQuery(document).ready(function ($) {
  const $window = $(window);
  const $document = $(document);
  const $header = $('header');
  const $navWrap = $('#nav-wrap');
  const $sections = $('section');
  const $navigationLinks = $('#nav-wrap a');
  const $contactForm = $('#contactForm');
  const $imageLoader = $('#image-loader');
  const $messageWarning = $('#message-warning');
  const $messageSuccess = $('#message-success');

  /*----------------------------------------------------*/
  /* FitText Settings
  ------------------------------------------------------ */
  setTimeout(function () {
    $('h1.responsive-headline').fitText(1, { minFontSize: '40px', maxFontSize: '90px' });
  }, 100);

  /*----------------------------------------------------*/
  /* Highlight the current section in the navigation bar
  ------------------------------------------------------*/
  $sections.waypoint({
    handler: function (event, direction) {
      let $activeSection = $(this);

      if (direction === 'up') {
        $activeSection = $activeSection.prev();
      }

      const activeId = $activeSection.attr('id');
      if (!activeId) {
        return;
      }

      const $activeLink = $navigationLinks.filter(`[href="#${activeId}"]`);

      $navigationLinks.parent().removeClass('current');
      $activeLink.parent().addClass('current');
    },
    offset: '35%'
  });

  /*----------------------------------------------------*/
  /* Fade In/Out Primary Navigation
  ------------------------------------------------------*/
  $window.on('scroll', function () {
    const headerHeight = $header.height();
    const scrollY = $window.scrollTop();

    if (scrollY > headerHeight * 0.15) {
      $navWrap.addClass('opaque');
    } else {
      $navWrap.removeClass('opaque');
    }
  });

  /*----------------------------------------------------*/
  /* Modal Popup
  ------------------------------------------------------*/
  $('.item-wrap a').magnificPopup({
    type: 'inline',
    fixedContentPos: false,
    removalDelay: 200,
    showCloseBtn: false,
    mainClass: 'mfp-fade'
  });

  $document.on('click', '.popup-modal-dismiss', function (event) {
    event.preventDefault();
    $.magnificPopup.close();
  });

  /*----------------------------------------------------*/
  /* Flexslider
  ------------------------------------------------------*/
  $('.flexslider').flexslider({
    namespace: 'flex-',
    controlsContainer: '.flex-container',
    animation: 'slide',
    controlNav: true,
    directionNav: false,
    smoothHeight: true,
    slideshowSpeed: 7000,
    animationSpeed: 600,
    randomize: false
  });

  /*----------------------------------------------------*/
  /* Contact form
  ------------------------------------------------------*/
  $contactForm.on('submit', function (event) {
    event.preventDefault();

    $imageLoader.fadeIn();

    $.ajax({
      type: 'POST',
      url: 'inc/sendEmail.php',
      data: $contactForm.serialize(),
      success: function (msg) {
        $imageLoader.fadeOut();

        if (msg === 'OK') {
          $messageWarning.hide();
          $contactForm.fadeOut();
          $messageSuccess.fadeIn();
        } else {
          $messageWarning.html(msg).fadeIn();
        }
      },
      error: function () {
        $imageLoader.fadeOut();
        $messageWarning.html('Something went wrong. Please try again later.').fadeIn();
      }
    });
  });
});
