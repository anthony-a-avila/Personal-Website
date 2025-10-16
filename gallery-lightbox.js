// gallery-lightbox.js
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #lightbox-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.9);
      display: none;           /* hidden by default */
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
    }
    body.no-scroll { overflow: hidden; }

    .lightbox-image-wrap {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
    }
    .lightbox-image-wrap img {
      display: block;
      max-width: 100%;
      max-height: 90vh;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      user-select: none;
    }

    /* Close (top-right): only visible when hovering the image area */
    .lightbox-close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      background: rgba(0,0,0,0.6);
      color: #fff;
      font-size: 22px;
      line-height: 32px;
      text-align: center;
      cursor: pointer;
      opacity: 0;
      transition: opacity .15s ease;
      user-select: none;
    }
    .lightbox-image-wrap:hover .lightbox-close { opacity: 1; }

    /* Left/Right arrows: appear when hovering the image area */
    .lightbox-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border-radius: 999px;
      background: rgba(0,0,0,0.6);
      color: #fff;
      font-size: 28px;
      line-height: 44px;
      text-align: center;
      cursor: pointer;
      opacity: 0;
      transition: opacity .15s ease;
      user-select: none;
    }
    .lightbox-prev { left: 8px; }
    .lightbox-next { right: 8px; }
    .lightbox-image-wrap:hover .lightbox-arrow { opacity: 1; }

    /* Bigger hit area for easier clicks (invisible) */
    .lightbox-arrow::after {
      content: "";
      position: absolute;
      inset: -10px;
    }

    /* Nice UX hint on thumbnails */
    .gallery img { cursor: zoom-in; }
  `;
  document.head.appendChild(style);

  // ---------- Gather gallery images ----------
  const thumbs = Array.from(document.querySelectorAll('.gallery img'));
  thumbs.forEach((img, i) => img.dataset.lbIndex = String(i));

  const images = thumbs.map(img => ({
    src: img.currentSrc || img.src,
    alt: img.alt || ''
  }));

  // ---------- Overlay DOM ----------
  const overlay = document.createElement('div');
  overlay.id = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const wrap = document.createElement('div');
  wrap.className = 'lightbox-image-wrap';

  const fullImg = document.createElement('img');

  const closeBtn = document.createElement('div');
  closeBtn.className = 'lightbox-close';
  closeBtn.setAttribute('role', 'button');
  closeBtn.setAttribute('aria-label', 'Close preview');
  closeBtn.textContent = '×';

  // Nav arrows
  const prevBtn = document.createElement('div');
  prevBtn.className = 'lightbox-arrow lightbox-prev';
  prevBtn.setAttribute('role', 'button');
  prevBtn.setAttribute('aria-label', 'Previous image');
  prevBtn.textContent = '‹';

  const nextBtn = document.createElement('div');
  nextBtn.className = 'lightbox-arrow lightbox-next';
  nextBtn.setAttribute('role', 'button');
  nextBtn.setAttribute('aria-label', 'Next image');
  nextBtn.textContent = '›';

  wrap.appendChild(fullImg);
  wrap.appendChild(closeBtn);
  wrap.appendChild(prevBtn);
  wrap.appendChild(nextBtn);
  overlay.appendChild(wrap);
  document.body.appendChild(overlay);

  let currentIndex = -1;

  // ---------- Helpers ----------
  function preload(i) {
    if (!images.length) return;
    const n = images.length;
    const ahead = new Image();
    ahead.src = images[(i + 1 + n) % n].src;
    const behind = new Image();
    behind.src = images[(i - 1 + n) % n].src;
  }

  function showAt(i) {
    if (!images.length) return;
    const n = images.length;
    currentIndex = (i % n + n) % n; // wrap
    const { src, alt } = images[currentIndex];
    fullImg.src = src;
    fullImg.alt = alt;
    preload(currentIndex);
  }

  function openLightbox(indexOrSrc, alt) {
    if (typeof indexOrSrc === 'number') {
      showAt(indexOrSrc);
    } else {
      // fallback when opening by src
      const i = images.findIndex(x => x.src === indexOrSrc);
      showAt(i === -1 ? 0 : i);
    }
    overlay.style.display = 'flex';
    document.body.classList.add('no-scroll');
    // Keep focus within dialog affordances
    nextBtn.focus?.();
  }

  function closeLightbox() {
    overlay.style.display = 'none';
    document.body.classList.remove('no-scroll');
    fullImg.src = ''; // free up memory
    currentIndex = -1;
  }

  function next() { if (images.length) showAt(currentIndex + 1); }
  function prev() { if (images.length) showAt(currentIndex - 1); }

  // ---------- Events ----------
  // Open: delegate clicks from any <img> inside .gallery
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.closest('.gallery')) {
      const idx = parseInt(t.dataset.lbIndex || '-1', 10);
      openLightbox(Number.isFinite(idx) && idx >= 0 ? idx : (t.currentSrc || t.src), t.alt);
    }
  });

  // Close when clicking the dark area (outside the image)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });

  // Prevent overlay-close when clicking UI controls
  [wrap, prevBtn, nextBtn, closeBtn].forEach(el => {
    el.addEventListener('click', (e) => e.stopPropagation());
  });

  // Buttons
  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (overlay.style.display === 'none') return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'ArrowRight') next();
  });

  // Basic swipe support (mobile)
  let touchStartX = null;
  wrap.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches?.[0]?.clientX ?? null;
  }, { passive: true });
  wrap.addEventListener('touchend', (e) => {
    if (touchStartX == null) return;
    const dx = (e.changedTouches?.[0]?.clientX ?? touchStartX) - touchStartX;
    const threshold = 30;
    if (dx > threshold) prev();
    else if (dx < -threshold) next();
    touchStartX = null;
  }, { passive: true });
})();
