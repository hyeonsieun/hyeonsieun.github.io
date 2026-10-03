(() => {
  'use strict';
  const root = document.documentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const themeButton = document.querySelector('.theme-toggle');
  const setTheme = theme => {
    root.dataset.theme = theme;
    if (themeButton) {
      themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
    }
  };
  let savedTheme;
  try { savedTheme = localStorage.getItem('sieun-theme'); } catch (_) { /* Storage is optional. */ }
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');
  themeButton?.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(theme);
    try { localStorage.setItem('sieun-theme', theme); } catch (_) { /* Keep the current session usable. */ }
  });

  const publications = [...document.querySelectorAll('.publication')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const search = document.querySelector('#publication-search');
  const feedback = document.querySelector('#publication-feedback');
  const emptyState = document.querySelector('#empty-state');
  let activeFilter = 'all';
  if (publications.length && search) {
    const searchable = new Map(publications.map(p => [p, p.textContent.toLocaleLowerCase()]));
    const applyFilters = (announce = true) => {
      const query = search.value.trim().toLocaleLowerCase();
      let count = 0;
      publications.forEach(publication => {
        const matchTopic = activeFilter === 'all' || publication.dataset.topics.split(' ').includes(activeFilter);
        const matchSearch = !query || searchable.get(publication).includes(query);
        const visible = matchTopic && matchSearch;
        publication.hidden = !visible;
        publication.classList.toggle('filter-enter', visible && !motion.matches);
        if (visible) count++;
      });
      document.querySelectorAll('.year-group').forEach(group => {
        group.hidden = ![...group.querySelectorAll('.publication')].some(p => !p.hidden);
      });
      filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter)));
      if (announce && feedback) feedback.textContent = `${count} matching publications.`;
      emptyState.hidden = count !== 0;
    };
    document.querySelector('#publication-controls').hidden = false;
    filters.forEach(button => button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      applyFilters();
    }));
    search.addEventListener('input', applyFilters);
    document.querySelector('#clear-filters').addEventListener('click', () => {
      activeFilter = 'all'; search.value = ''; applyFilters(); search.focus();
    });
    document.querySelectorAll('[data-research]').forEach(link => link.addEventListener('click', () => {
      activeFilter = link.dataset.research;
      search.value = '';
      applyFilters();
    }));
    applyFilters(false);
  }

  // Motion is a progressive enhancement; content never depends on it being enabled.
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!motion.matches) entry.target.classList.add('is-revealed');
        reveal.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(item => reveal.observe(item));
    const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
    const sections = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    }), { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    navLinks.forEach(link => { const target = document.querySelector(link.getAttribute('href')); if (target) sections.observe(target); });
  }
  const note = document.querySelector('.research-note');
  if (note) {
    note.addEventListener('pointermove', event => {
      if (motion.matches || event.pointerType !== 'mouse') return;
      const rect = note.getBoundingClientRect();
      note.style.setProperty('--map-x', `${((event.clientX - rect.left) / rect.width - 0.5) * 9}px`);
      note.style.setProperty('--map-y', `${((event.clientY - rect.top) / rect.height - 0.5) * 9}px`);
    });
    note.addEventListener('pointerleave', () => {
      note.style.setProperty('--map-x', '0px'); note.style.setProperty('--map-y', '0px');
    });
  }
})();
