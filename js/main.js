/* ========================================================
   CALIFORNIA CABINETS — Shared JavaScript
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Nav: scroll shadow + hamburger ── */
  const nav  = document.getElementById('nav');
  const ham  = document.querySelector('.nav-hamburger');
  const links = document.querySelector('.nav-links');

  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  if (ham && links) {
    ham.addEventListener('click', () => {
      ham.classList.toggle('open');
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        ham.classList.remove('open');
        links.classList.remove('open');
      })
    );
  }

  /* ── Set active nav link ── */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const page = href.split('/').pop();
    if (page === currentPage || (currentPage === '' && page === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ── Scroll reveal ── */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  /* ── Lightbox ── */
  let lbImages = [];
  let lbIndex  = 0;

  const lb      = document.getElementById('lightbox');
  const lbImg   = document.getElementById('lb-img');
  const lbClose = document.querySelector('.lb-close');
  const lbPrev  = document.querySelector('.lb-prev');
  const lbNext  = document.querySelector('.lb-next');
  const lbCount = document.querySelector('.lb-counter');

  function collectImages() {
    lbImages = Array.from(document.querySelectorAll('[data-lightbox]')).map(el => ({
      src:     el.dataset.lightbox || el.querySelector('img')?.src || el.src,
      caption: el.dataset.caption || ''
    }));
  }

  function openLb(idx) {
    if (!lb || !lbImg) return;
    lbIndex = ((idx % lbImages.length) + lbImages.length) % lbImages.length;
    lbImg.src = lbImages[lbIndex].src;
    lbImg.alt = lbImages[lbIndex].caption;
    if (lbCount) lbCount.textContent = `${lbIndex + 1} / ${lbImages.length}`;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLb() {
    if (!lb) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
    if (lbImg) lbImg.src = '';
  }

  collectImages();

  document.querySelectorAll('[data-lightbox]').forEach((el, i) => {
    el.addEventListener('click', () => openLb(i));
  });

  if (lbClose) lbClose.addEventListener('click', closeLb);
  if (lbPrev)  lbPrev.addEventListener('click', () => openLb(lbIndex - 1));
  if (lbNext)  lbNext.addEventListener('click', () => openLb(lbIndex + 1));
  if (lb)      lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', e => {
    if (!lb?.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLb();
    if (e.key === 'ArrowLeft')   openLb(lbIndex - 1);
    if (e.key === 'ArrowRight')  openLb(lbIndex + 1);
  });

  /* ── Gallery filter ── */
  const filterBtns = document.querySelectorAll('.gf-btn');
  const galleryItems = document.querySelectorAll('.gi[data-cat]');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      galleryItems.forEach(item => {
        if (cat === 'all' || item.dataset.cat === cat) {
          item.removeAttribute('hidden');
        } else {
          item.setAttribute('hidden', '');
        }
      });
      collectImages(); // re-index after filter
    });
  });

  /* ── Smooth anchor scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});
