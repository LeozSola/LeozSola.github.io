(() => {
  const header = document.querySelector('[data-site-header]');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('[data-nav-links]');
  const internalLinks = navLinks ? [...navLinks.querySelectorAll('a[href^="#"]')] : [];
  const sections = [...document.querySelectorAll('main section[id]')];

  const closeNavigation = () => {
    if (!toggle || !navLinks) return;
    toggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  };

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(willOpen));
      navLinks.classList.toggle('is-open', willOpen);
      document.body.classList.toggle('nav-open', willOpen);
    });

    navLinks.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeNavigation();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeNavigation();
        toggle.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.nav-shell')) closeNavigation();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) closeNavigation();
    });
  }

  const updateHeader = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Reposition direct section links after fonts and images settle.
  window.addEventListener('load', () => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (!target) return;
    const previousBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    target.scrollIntoView();
    document.documentElement.style.scrollBehavior = previousBehavior;
  });

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      internalLinks.forEach((link) => {
        const isCurrent = link.getAttribute('href') === `#${visible.target.id}`;
        if (isCurrent) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, {
      rootMargin: '-18% 0px -66% 0px',
      threshold: [0, 0.15, 0.4]
    });

    sections.forEach((section) => observer.observe(section));
  }

  const year = document.querySelector('[data-current-year]');
  if (year) year.textContent = new Date().getFullYear();

  const dialogTriggers = [...document.querySelectorAll('[data-dialog]')];
  let activeDialogTrigger = null;

  const closeDialog = (dialog) => {
    if (!dialog?.open) return;
    dialog.close();
  };

  dialogTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const dialog = document.getElementById(trigger.dataset.dialog);
      if (!(dialog instanceof HTMLDialogElement)) return;
      activeDialogTrigger = trigger;
      dialog.showModal();
      document.body.classList.add('dialog-open');
      dialog.querySelector('[data-dialog-close]')?.focus();
    });
  });

  document.querySelectorAll('.project-dialog').forEach((dialog) => {
    dialog.querySelector('[data-dialog-close]')?.addEventListener('click', () => closeDialog(dialog));

    dialog.addEventListener('click', (event) => {
      const bounds = dialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (outside) closeDialog(dialog);
    });

    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      activeDialogTrigger?.focus();
      activeDialogTrigger = null;
    });
  });
})();
