(() => {
  const links = [...document.querySelectorAll('.photo-card, .gallery-item')];
  if (!links.length || typeof HTMLDialogElement === 'undefined') return;

  const icon = (path) => `<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const dialog = document.createElement('dialog');
  dialog.className = 'photo-viewer';
  dialog.setAttribute('aria-label', 'Photography viewer');
  dialog.setAttribute('aria-describedby', 'photo-viewer-help');
  dialog.innerHTML = `
    <div class="photo-viewer-topbar">
      <div><span class="eyebrow">Photography</span><span class="photo-viewer-count" data-photo-count></span></div>
      <button type="button" data-photo-close aria-label="Close photo viewer">${icon('M6 6l12 12M18 6 6 18')}</button>
    </div>
    <div class="photo-viewer-stage" data-photo-stage>
      <img class="photo-viewer-image" data-photo-image alt="" draggable="false">
      <p class="photo-viewer-status" data-photo-status role="status"></p>
    </div>
    <div class="photo-viewer-bottom">
      <div class="photo-viewer-caption" data-photo-caption aria-live="polite"></div>
      <div class="photo-viewer-controls" role="group" aria-label="Photo controls">
        <button type="button" data-photo-prev aria-label="Previous photo" title="Previous photo (Left arrow)">${icon('m14 6-6 6 6 6')}</button>
        <span class="photo-viewer-divider" aria-hidden="true"></span>
        <button type="button" data-photo-out aria-label="Zoom out" title="Zoom out (-)">${icon('M5 12h14')}</button>
        <output class="photo-viewer-zoom" data-photo-zoom aria-label="Zoom relative to fitted view">100%</output>
        <button type="button" data-photo-in aria-label="Zoom in" title="Zoom in (+)">${icon('M5 12h14M12 5v14')}</button>
        <button type="button" class="photo-viewer-fit" data-photo-fit title="Fit to screen (0)">Fit</button>
        <span class="photo-viewer-divider" aria-hidden="true"></span>
        <button type="button" data-photo-next aria-label="Next photo" title="Next photo (Right arrow)">${icon('m10 6 6 6-6 6')}</button>
      </div>
      <p class="photo-viewer-help" id="photo-viewer-help">Scroll or pinch to zoom · Drag to explore · Arrow keys to browse · Esc to close</p>
    </div>`;
  document.body.append(dialog);

  const find = (name) => dialog.querySelector(`[data-photo-${name}]`);
  const stage = find('stage');
  const image = find('image');
  const status = find('status');
  const pointers = new Map();
  let index = 0;
  let origin = null;
  let scale = 1;
  let x = 0;
  let y = 0;
  let width = 0;
  let height = 0;
  let ready = false;
  let gesture = null;
  let request = 0;
  const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

  const draw = () => {
    x = clamp(x, Math.max(0, (width * scale - stage.clientWidth) / 2));
    y = clamp(y, Math.max(0, (height * scale - stage.clientHeight) / 2));
    image.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`;
    stage.classList.toggle('is-zoomed', scale > 1);
    find('zoom').value = `${Math.round(scale * 100)}%`;
    find('out').disabled = !ready || scale <= 1;
    find('in').disabled = !ready || scale >= 8;
    find('fit').disabled = !ready;
  };

  const fit = () => {
    if (!ready) return;
    const ratio = Math.min(stage.clientWidth / image.naturalWidth, stage.clientHeight / image.naturalHeight, 1);
    width = image.naturalWidth * ratio;
    height = image.naturalHeight * ratio;
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    scale = 1; x = 0; y = 0;
    draw();
  };

  const zoom = (value, anchorX = 0, anchorY = 0) => {
    if (!ready) return;
    const next = Math.max(1, Math.min(8, value));
    x = anchorX - (anchorX - x) * next / scale;
    y = anchorY - (anchorY - y) * next / scale;
    scale = next;
    draw();
  };

  const show = (nextIndex) => {
    index = (nextIndex + links.length) % links.length;
    const link = links[index];
    const thumbnail = link.querySelector('img');
    const currentRequest = ++request;
    pointers.clear(); gesture = null;
    stage.classList.remove('is-dragging');
    ready = false; scale = 1; x = 0; y = 0;
    image.hidden = true;
    status.textContent = 'Loading full-resolution photo…';
    stage.setAttribute('aria-busy', 'true');
    find('count').textContent = `${index + 1} / ${links.length}`;
    find('caption').textContent = thumbnail.alt;
    image.alt = thumbnail.alt;
    image.onload = () => {
      if (currentRequest !== request) return;
      ready = true;
      image.hidden = false;
      status.textContent = '';
      stage.removeAttribute('aria-busy');
      fit();
    };
    image.onerror = () => {
      if (currentRequest !== request) return;
      status.textContent = 'This photo couldn’t load. Try another photo or close and reopen the viewer.';
      stage.removeAttribute('aria-busy');
    };
    image.src = link.href;
    draw();
  };

  links.forEach((link, photoIndex) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-label', `View ${link.querySelector('img').alt.toLowerCase()} in photo viewer`);
    link.addEventListener('click', (event) => {
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      origin = link;
      dialog.showModal();
      document.body.classList.add('photo-viewer-open');
      show(photoIndex);
      find('close').focus();
    });
  });

  find('close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    ++request;
    image.onload = null; image.onerror = null;
    image.removeAttribute('src');
    pointers.clear(); gesture = null;
    document.body.classList.remove('photo-viewer-open');
    origin?.focus({ preventScroll: true });
  });
  find('prev').addEventListener('click', () => show(index - 1));
  find('next').addEventListener('click', () => show(index + 1));
  find('in').addEventListener('click', () => zoom(scale * 1.5));
  find('out').addEventListener('click', () => zoom(scale / 1.5));
  find('fit').addEventListener('click', fit);
  dialog.addEventListener('keydown', (event) => {
    const action = {
      Escape: () => dialog.close(),
      ArrowLeft: () => show(index - 1), ArrowRight: () => show(index + 1),
      '+': () => zoom(scale * 1.5), '=': () => zoom(scale * 1.5),
      '-': () => zoom(scale / 1.5), '0': fit
    }[event.key];
    if (action) { event.preventDefault(); action(); }
  });
  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    const bounds = stage.getBoundingClientRect();
    zoom(scale * Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.04 : 0.002)),
      event.clientX - bounds.left - bounds.width / 2, event.clientY - bounds.top - bounds.height / 2);
  }, { passive: false });
  stage.addEventListener('dblclick', (event) => {
    const bounds = stage.getBoundingClientRect();
    if (scale > 1) fit();
    else zoom(2, event.clientX - bounds.left - bounds.width / 2, event.clientY - bounds.top - bounds.height / 2);
  });

  const beginGesture = () => {
    const points = [...pointers.values()];
    if (!points.length) { gesture = null; return; }
    const [a, b] = points;
    const bounds = stage.getBoundingClientRect();
    gesture = {
      x, y, scale,
      cx: (b ? (a.x + b.x) / 2 : a.x) - bounds.left - bounds.width / 2,
      cy: (b ? (a.y + b.y) / 2 : a.y) - bounds.top - bounds.height / 2,
      distance: b ? Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) : 0
    };
  };
  stage.addEventListener('pointerdown', (event) => {
    if (!ready || event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
    beginGesture();
  });
  stage.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const [a, b] = [...pointers.values()];
    const bounds = stage.getBoundingClientRect();
    const cx = (b ? (a.x + b.x) / 2 : a.x) - bounds.left - bounds.width / 2;
    const cy = (b ? (a.y + b.y) / 2 : a.y) - bounds.top - bounds.height / 2;
    if (b && gesture.distance) scale = Math.max(1, Math.min(8, gesture.scale * Math.hypot(a.x - b.x, a.y - b.y) / gesture.distance));
    x = cx - (gesture.cx - gesture.x) * scale / gesture.scale;
    y = cy - (gesture.cy - gesture.y) * scale / gesture.scale;
    draw();
  });
  const endPointer = (event) => {
    pointers.delete(event.pointerId);
    if (!pointers.size) stage.classList.remove('is-dragging');
    beginGesture();
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('lostpointercapture', endPointer);
  new ResizeObserver(() => { if (dialog.open) fit(); }).observe(stage);
})();
