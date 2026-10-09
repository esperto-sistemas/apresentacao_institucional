(() => {
  'use strict';

  const presentation = document.querySelector('#presentation');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const counter = document.querySelector('#counter');
  const previousButton = document.querySelector('#previousButton');
  const nextButton = document.querySelector('#nextButton');
  const fullscreenButton = document.querySelector('#fullscreenButton');

  let currentIndex = readInitialIndex();
  let controlsTimer = 0;
  let transitionTimer = 0;
  let touchStartX = null;
  let touchStartY = null;

  function readInitialIndex() {
    const number = Number.parseInt(window.location.hash.slice(1), 10);
    return Number.isInteger(number) && number >= 1 && number <= slides.length ? number - 1 : 0;
  }

  function render(nextIndex, { animate = true } = {}) {
    const targetIndex = Math.max(0, Math.min(slides.length - 1, nextIndex));
    const oldSlide = slides[currentIndex];
    const newSlide = slides[targetIndex];

    window.clearTimeout(transitionTimer);

    if (animate && targetIndex !== currentIndex) {
      oldSlide.classList.remove('is-active');
      oldSlide.classList.add('is-leaving');
      transitionTimer = window.setTimeout(() => oldSlide.classList.remove('is-leaving'), 150);
    } else {
      slides.forEach((slide, index) => slide.classList.toggle('is-active', index === targetIndex));
    }

    currentIndex = targetIndex;
    newSlide.classList.remove('is-leaving');
    newSlide.classList.add('is-active');

    const visibleNumber = String(currentIndex + 1).padStart(2, '0');
    counter.value = `${visibleNumber} / ${String(slides.length).padStart(2, '0')}`;
    counter.textContent = counter.value;
    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === slides.length - 1;
    window.history.replaceState(null, '', `#${currentIndex + 1}`);
    document.title = `${visibleNumber} — ${newSlide.dataset.title}`;
  }

  function showControls() {
    presentation.classList.add('controls-visible');
    window.clearTimeout(controlsTimer);
    controlsTimer = window.setTimeout(() => {
      if (!document.querySelector('.controls:focus-within')) {
        presentation.classList.remove('controls-visible');
      }
    }, 2200);
  }

  function goTo(index) {
    render(index);
    showControls();
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      showControls();
    }
  }

  function updateFullscreenButton() {
    const active = Boolean(document.fullscreenElement);
    fullscreenButton.setAttribute('aria-label', active ? 'Sair da tela cheia' : 'Entrar em tela cheia');
    fullscreenButton.title = active ? 'Sair da tela cheia (F)' : 'Tela cheia (F)';
  }

  previousButton.addEventListener('click', () => goTo(currentIndex - 1));
  nextButton.addEventListener('click', () => goTo(currentIndex + 1));
  fullscreenButton.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenButton);
  document.addEventListener('mousemove', showControls);

  document.addEventListener('keydown', (event) => {
    if (event.target.closest?.('button') && (event.key === ' ' || event.key === 'Enter')) return;

    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      goTo(currentIndex + 1);
      return;
    }

    if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      goTo(currentIndex - 1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      goTo(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      goTo(slides.length - 1);
      return;
    }

    if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      toggleFullscreen();
    }
  });

  document.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    showControls();
  }, { passive: true });

  document.addEventListener('touchend', (event) => {
    if (touchStartX === null || touchStartY === null) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;

    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      goTo(currentIndex + (deltaX < 0 ? 1 : -1));
    }
  }, { passive: true });

  window.addEventListener('hashchange', () => render(readInitialIndex()));

  render(currentIndex, { animate: false });
  showControls();
})();
