const navigationEntry = performance.getEntriesByType('navigation')[0];

if (navigationEntry?.type === 'reload') {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  if (window.location.hash) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }

  window.scrollTo(0, 0);
}
