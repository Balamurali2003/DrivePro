/* Navbar scroll behaviour */
(function () {
  const navbar = document.getElementById('navbar');
  const inner  = document.getElementById('navbar-inner');
  const logoText  = document.querySelectorAll('.navbar-logo-text');
  const phoneText = document.querySelectorAll('.navbar-phone-text');
  const navActive = document.querySelectorAll('.nav-active');

  function onScroll() {
    const scrolled = window.scrollY > 16;

    if (scrolled) {
      navbar.classList.replace('py-4', 'py-2');
      inner.classList.remove('bg-ink/40', 'backdrop-blur-md', 'border', 'border-white/10', 'h-16');
      inner.classList.add('h-14', 'shadow-card');
      inner.style.background = 'rgba(255,255,255,0.7)';
      inner.style.backdropFilter = 'blur(20px) saturate(160%)';
      inner.style.border = '1px solid rgba(20,20,20,0.06)';

      logoText.forEach(el => {
        el.classList.remove('text-white');
        el.classList.add('text-ink');
      });
      phoneText.forEach(el => {
        el.classList.remove('text-white');
        el.classList.add('text-ink');
      });
      navActive.forEach(el => {
        el.classList.remove('text-yellow');
        el.classList.add('text-ink');
        const pill = el.querySelector('span');
        if (pill) { pill.classList.remove('bg-white/10'); pill.classList.add('bg-secondary'); }
      });
    } else {
      navbar.classList.replace('py-2', 'py-4');
      inner.classList.remove('h-14', 'shadow-card');
      inner.classList.add('bg-ink/40', 'backdrop-blur-md', 'border', 'border-white/10', 'h-16');
      inner.style.background = '';
      inner.style.backdropFilter = '';
      inner.style.border = '';

      logoText.forEach(el => {
        el.classList.add('text-white');
        el.classList.remove('text-ink');
      });
      phoneText.forEach(el => {
        el.classList.add('text-white');
        el.classList.remove('text-ink');
      });
      navActive.forEach(el => {
        el.classList.add('text-yellow');
        el.classList.remove('text-ink');
        const pill = el.querySelector('span');
        if (pill) { pill.classList.add('bg-white/10'); pill.classList.remove('bg-secondary'); }
      });
    }
  }

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* Mobile nav toggle */
(function () {
  const toggle   = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('nav-mobile');
  const iconMenu  = document.getElementById('nav-icon-menu');
  const iconClose = document.getElementById('nav-icon-close');

  if (!toggle) return;

  toggle.addEventListener('click', function () {
    const open = !mobileNav.classList.contains('hidden');
    if (open) {
      mobileNav.classList.add('hidden');
      iconMenu.classList.remove('hidden');
      iconClose.classList.add('hidden');
    } else {
      mobileNav.classList.remove('hidden');
      iconMenu.classList.add('hidden');
      iconClose.classList.remove('hidden');
    }
  });
})();

/* Scroll-reveal animations using IntersectionObserver */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.55s ease, transform 0.55s ease; }
    .reveal.visible { opacity: 1; transform: none; }
    .fade-in-up { opacity: 0; transform: translateY(20px); animation: fadeInUp 0.7s ease forwards; }
    @keyframes fadeInUp { to { opacity: 1; transform: none; } }
  `;
  document.head.appendChild(style);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseFloat(el.dataset.delay || '0');
          setTimeout(() => el.classList.add('visible'), delay * 1000);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.1, rootMargin: '-30px' }
  );

  document.querySelectorAll('.reveal').forEach((el, i) => {
    if (!el.dataset.delay) {
      const siblings = Array.from(el.parentElement?.children || []).filter(c => c.classList.contains('reveal'));
      const idx = siblings.indexOf(el);
      if (idx > 0) el.dataset.delay = String(Math.min(idx * 0.06, 0.3));
    }
    observer.observe(el);
  });
})();
