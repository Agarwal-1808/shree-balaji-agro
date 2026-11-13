/* Homepage-only decorative video. The original photograph is always underneath. */
'use strict';
(() => {
  const video = document.querySelector('#hero-video');
  if (!video) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = window.matchMedia('(max-width: 760px)');
  const connection = navigator.connection;
  let visible = true;
  let failed = false;
  let timer;
  let attempt = 0;
  const desired = () => !reducedMotion.matches && !connection?.saveData &&
    visible && !document.hidden && !failed;
  const showPoster = () => video.classList.remove('is-playing');
  function release() {
    attempt += 1;
    window.clearTimeout(timer);
    showPoster();
    video.pause();
    if (video.hasAttribute('src')) {
      video.removeAttribute('src');
      video.load();
    }
  }
  function fail() {
    failed = true;
    release();
  }
  function sync() {
    if (reducedMotion.matches || connection?.saveData) {
      release();
      return;
    }
    if (!desired()) {
      attempt += 1;
      window.clearTimeout(timer);
      video.pause();
      showPoster();
      return;
    }
    if (!video.hasAttribute('src')) {
      video.src = smallScreen.matches ? video.dataset.mobileSrc : video.dataset.desktopSrc;
      video.load();
    }
    // Set properties as well as attributes for Safari's muted autoplay policy.
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    const currentAttempt = ++attempt;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (currentAttempt === attempt && desired() && !video.classList.contains('is-playing')) fail();
    }, 12000);
    const play = video.play();
    if (play?.catch) play.catch(() => {
      if (currentAttempt === attempt && desired()) fail();
    });
  }
  video.addEventListener('playing', () => {
    if (!desired()) { video.pause(); return; }
    window.clearTimeout(timer);
    video.classList.add('is-playing');
  });
  video.addEventListener('error', () => { if (video.hasAttribute('src')) fail(); });
  video.addEventListener('pause', showPoster);
  video.addEventListener('waiting', showPoster);
  reducedMotion.addEventListener('change', sync);
  connection?.addEventListener?.('change', sync);
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    }, { threshold: 0 });
    observer.observe(video.closest('.home-hero'));
  }
  sync();
})();
