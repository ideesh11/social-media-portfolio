/* =====================================================================
   IDEESH POOJARY — Portfolio · main.js
   Nav · reveals · marquee · video previews · lightbox · social links
   ===================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------------------
     SOCIAL LINKS — single source of truth.
     Paste the exact profile URLs here. Any link left empty will
     fall back to the contact section instead of a dead "#" href.
     ------------------------------------------------------------- */
  const SOCIAL_LINKS = {
    instagram: 'https://www.instagram.com/fusionlabsai?stkn=aGhkYzZzb2htbWNh',
    threads: 'https://www.threads.com/@fusionlabsai',
    linkedin: 'https://www.linkedin.com/in/ideesh-poojary-69a711354?utm_source=share_via&utm_content=profile&utm_medium=member_android'
  };

  document.querySelectorAll('[data-social]').forEach(function (a) {
    const key = a.getAttribute('data-social');
    const url = SOCIAL_LINKS[key];
    if (url) {
      a.href = url;
    } else {
      a.href = '#contact';
      a.removeAttribute('target');
      a.removeAttribute('rel');
      a.setAttribute('title', 'Profile link coming soon — reach me by email');
    }
  });

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header scroll state ---------- */
  const header = document.getElementById('site-header');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  }
  toggle.addEventListener('click', function () {
    setMenu(!menu.classList.contains('is-open'));
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && menu.classList.contains('is-open')) setMenu(false);
  });

  /* ---------- Active nav link ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
  const sectionMap = navLinks.map(function (a) {
    return { link: a, el: document.querySelector(a.getAttribute('href')) };
  }).filter(function (o) { return o.el; });

  if ('IntersectionObserver' in window && sectionMap.length) {
    const navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove('is-active'); });
          const match = sectionMap.find(function (o) { return o.el === entry.target; });
          if (match) match.link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sectionMap.forEach(function (o) { navObs.observe(o.el); });
  }

  /* ---------- Scroll reveals ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Lazy-load videos + muted hover preview ---------- */
  const videoCards = Array.from(document.querySelectorAll('.media-card--video'));
  const canHover = window.matchMedia('(hover: hover)').matches;

  function ensureSrc(video) {
    if (!video.getAttribute('src') && video.dataset.src) {
      video.setAttribute('src', video.dataset.src);
      video.load();
    }
  }

  // Load lazily when near the viewport so the poster frame appears.
  if ('IntersectionObserver' in window) {
    const vidObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const v = entry.target.querySelector('video');
          if (v) { ensureSrc(v); v.preload = 'metadata'; }
          vidObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '300px 0px' });
    videoCards.forEach(function (c) { vidObs.observe(c); });
  } else {
    videoCards.forEach(function (c) { const v = c.querySelector('video'); if (v) ensureSrc(v); });
  }

  let activePreview = null;
  function startPreview(card) {
    const v = card.querySelector('video');
    if (!v) return;
    if (activePreview && activePreview !== v) stopPreview(activePreview.closest('.media-card'));
    ensureSrc(v);
    v.muted = true;
    const p = v.play();
    if (p && p.catch) p.catch(function () {});
    card.classList.add('is-previewing');
    activePreview = v;
  }
  function stopPreview(card) {
    if (!card) return;
    const v = card.querySelector('video');
    if (!v) return;
    v.pause();
    try { v.currentTime = 0.1; } catch (e) {}
    card.classList.remove('is-previewing');
    if (activePreview === v) activePreview = null;
  }

  if (canHover) {
    videoCards.forEach(function (card) {
      card.addEventListener('mouseenter', function () { startPreview(card); });
      card.addEventListener('mouseleave', function () { stopPreview(card); });
      card.addEventListener('focus', function () { startPreview(card); });
      card.addEventListener('blur', function () { stopPreview(card); });
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = document.getElementById('lightbox');
  const lbStage = document.getElementById('lightbox-stage');
  const lbCaption = document.getElementById('lightbox-caption');
  const lbClose = document.getElementById('lightbox-close');
  const lbPrev = document.getElementById('lightbox-prev');
  const lbNext = document.getElementById('lightbox-next');

  const triggers = Array.from(document.querySelectorAll('[data-lightbox]'));
  let group = [];
  let index = 0;
  let lastFocus = null;

  function buildStage(item) {
    lbStage.innerHTML = '';
    if (item.type === 'video') {
      const v = document.createElement('video');
      v.src = item.src;
      v.controls = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.preload = 'auto';
      v.autoplay = true;
      v.muted = false;
      v.setAttribute('aria-label', item.caption || 'Video');
      lbStage.appendChild(v);
      const p = v.play();
      if (p && p.catch) p.catch(function () { v.muted = true; v.play().catch(function () {}); });
    } else {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt || item.caption || '';
      lbStage.appendChild(img);
    }
    lbCaption.textContent = item.caption || '';
    const multi = group.length > 1;
    lbPrev.hidden = !multi;
    lbNext.hidden = !multi;
  }

  function openLightbox(trigger) {
    // Pause any hover preview so we don't have two videos running.
    if (activePreview) stopPreview(activePreview.closest('.media-card'));

    const g = trigger.getAttribute('data-lightbox');
    group = triggers.filter(function (t) { return t.getAttribute('data-lightbox') === g; }).map(function (t) {
      const img = t.querySelector('img');
      return {
        type: t.getAttribute('data-type') || 'image',
        src: t.getAttribute('data-src'),
        caption: t.getAttribute('data-caption') || '',
        alt: img ? img.alt : ''
      };
    });
    index = triggers.filter(function (t) { return t.getAttribute('data-lightbox') === g; }).indexOf(trigger);
    lastFocus = trigger;
    buildStage(group[index]);
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    lbClose.focus();
  }

  function closeLightbox() {
    const v = lbStage.querySelector('video');
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    setTimeout(function () { lbStage.innerHTML = ''; }, 400);
    if (lastFocus) lastFocus.focus();
  }

  function step(dir) {
    if (group.length < 2) return;
    index = (index + dir + group.length) % group.length;
    buildStage(group[index]);
  }

  triggers.forEach(function (t) {
    t.addEventListener('click', function (e) {
      e.preventDefault();
      openLightbox(t);
    });
  });
  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', function () { step(-1); });
  lbNext.addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target === lbStage || e.target.classList.contains('lightbox-figure')) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  // Touch swipe in lightbox
  let touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });

  /* ---------- Smooth anchor offset for fixed header ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.replaceState(null, '', id);
    });
  });
})();
