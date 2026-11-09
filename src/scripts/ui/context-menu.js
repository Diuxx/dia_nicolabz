/** Menu contextuel réutilisable. Les libellés sont ajoutés en textContent. */
export function createContextMenu(element) {
  let currentItems = [];
  let isOpen = false;

  function close() {
    if (!isOpen) return;
    isOpen = false;
    element.hidden = true;
    element.replaceChildren();
  }

  function open({ x, y, heading, items }) {
    close();
    currentItems = items.filter((item) => !item.hidden);
    if (!currentItems.length) return;
    const title = document.createElement('div');
    title.className = 'context-heading';
    title.textContent = heading;
    element.append(title);
    for (const item of currentItems) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `context-action${item.danger ? ' danger' : ''}`;
      button.setAttribute('role', 'menuitem');
      button.textContent = item.label;
      button.addEventListener('click', () => { close(); item.run(); });
      element.appendChild(button);
    }
    element.hidden = false;
    isOpen = true;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    element.style.left = `${Math.max(8, Math.min(x, window.innerWidth - width - 8))}px`;
    element.style.top = `${Math.max(8, Math.min(y, window.innerHeight - height - 8))}px`;
    element.querySelector('button')?.focus({ preventScroll: true });
  }

  element.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { close(); return; }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...element.querySelectorAll('button')];
    const current = buttons.indexOf(document.activeElement);
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    buttons[(current + delta + buttons.length) % buttons.length]?.focus();
  });
  document.addEventListener('pointerdown', (event) => {
    if (isOpen && !element.contains(event.target)) close();
  }, true);
  window.addEventListener('blur', close);
  return { open, close };
}
