// The shared theme manager owns persistence and system preference changes.
const toggle = document.getElementById('theme-toggle');
const theme = window.nicolabzTheme;

if (toggle && theme) {
  const icon = toggle.querySelector('use');

  function renderThemeToggle() {
    const isDark = theme.getTheme() === 'dark';
    const label = isDark ? 'Activer le thème clair' : 'Activer le thème sombre';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    icon.setAttribute('href', `/design-system/icons.svg#${isDark ? 'sun' : 'moon'}`);
  }

  toggle.addEventListener('click', () => theme.toggle());
  window.addEventListener('nicolabz-theme-change', renderThemeToggle);
  renderThemeToggle();
}
