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
  const $sections = $('section[id], header#home');
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
  const updateActiveNav = () => {
    const navHeight = $navWrap.outerHeight() || 0;
    const scrollPosition = $window.scrollTop() + navHeight + 16;
    let activeId = '';

    $sections.each(function () {
      const $section = $(this);
      const sectionTop = $section.offset().top;

      if (scrollPosition >= sectionTop) {
        activeId = $section.attr('id') || activeId;
      }
    });

    if (!activeId) {
      return;
    }

    const $activeLink = $navigationLinks.filter(`[href="#${activeId}"]`);
    if (!$activeLink.length) {
      return;
    }

    $navigationLinks.parent().removeClass('current');
    $activeLink.parent().addClass('current');
  };

  updateActiveNav();

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

    updateActiveNav();
  });

  $window.on('resize', updateActiveNav);

  /*----------------------------------------------------*/
  /* Modal Popup
  ------------------------------------------------------*/
  const initModalLinks = (context) => {
    const $context = $(context);
    $context.find('.item-wrap a').magnificPopup({
      type: 'inline',
      fixedContentPos: false,
      removalDelay: 200,
      showCloseBtn: false,
      mainClass: 'mfp-fade'
    });
  };

  initModalLinks(document);

  $document.on('click', '.popup-modal-dismiss', function (event) {
    event.preventDefault();
    $.magnificPopup.close();
  });

  /*----------------------------------------------------*/
  /* Photography Gallery Loader
  ------------------------------------------------------*/
  const photographyTemplate = document.getElementById('photography-template');
  const loadPhotographyButton = $('#load-photography');

  if (photographyTemplate && loadPhotographyButton.length) {
    loadPhotographyButton.on('click', function () {
      const placeholder = document.getElementById('photography-placeholder');

      if (!placeholder) {
        return;
      }

      const fragment = photographyTemplate.content.cloneNode(true);
      placeholder.replaceWith(fragment);
      initModalLinks($('#photography'));
      updateActiveNav();

      $(this).attr('aria-expanded', 'true').remove();
    });
  }

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

    if (!$contactForm.length) {
      return;
    }

    const formElement = $contactForm.get(0);
    const endpoint = formElement.getAttribute('action') || '';

    $messageWarning.hide().empty();
    $imageLoader.fadeIn();

    if (!endpoint || endpoint === 'PASTE ENDPOINT') {
      $imageLoader.fadeOut();
      $messageWarning
        .html('The contact form is not configured yet. Please update the Formspree endpoint.')
        .fadeIn();
      return;
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(formElement)
    })
      .then(async (response) => {
        $imageLoader.fadeOut();

        if (response.ok) {
          $contactForm.get(0).reset();
          $contactForm.fadeOut();
          $messageSuccess.fadeIn();
          return;
        }

        const data = await response.json().catch(() => ({}));
        let errorMessage = 'Something went wrong. Please try again later.';

        if (data && data.errors && data.errors.length) {
          errorMessage = data.errors.map((error) => error.message).join('<br>');
        }

        $messageWarning.html(errorMessage).fadeIn();
      })
      .catch(() => {
        $imageLoader.fadeOut();
        $messageWarning.html('Something went wrong. Please try again later.').fadeIn();
      });
  });
});
