import { mountIdentity } from './ui/identity-ui.js';
import { createContextMenu } from './ui/context-menu.js';

/* ArchCanvas — dependency-free browser whiteboard. No external network calls. */
(() => {
  'use strict';

  const NODE_W = 158;
  const NODE_H = 141;
  const CANVAS_W = 3200;
  const CANVAS_H = 2400;
  const STORAGE_KEY = 'archcanvas-v2-project';
  const LEGACY_STORAGE_KEY = 'archcanvas-poc-v1';
  const COLORS = ['#f1f3ff', '#e8f8ff', '#effbea', '#fff3df', '#fff0f4', '#f4edff'];
  const $ = (id) => document.getElementById(id);
  const svgNs = 'http://www.w3.org/2000/svg';
  const presetIcons = window.ArchIcons.presets;
  const escapeXml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const uid = () => (window.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const deepCopy = (data) => JSON.parse(JSON.stringify(data));

  const ui = {
    board: $('board'), world: $('world'), nodes: $('node-layer'), edges: $('edge-layer'),
    preview: $('preview-layer'), palette: $('palette'), name: $('project-name'),
    search: $('icon-search'), inspectorEmpty: $('inspector-empty'),
    nodeInspector: $('node-inspector'), edgeInspector: $('edge-inspector'),
    toast: $('toast')
  };

  const demoProject = () => ({
    version: 1,
    name: 'Architecture de démonstration',
    customIcons: [],
    nodes: [
      { id: 'client', iconId: 'browser', title: 'Application web', description: 'Frontend / HTTPS', x: 70, y: 245, color: COLORS[1] },
      { id: 'proxy', iconId: 'gateway', title: 'Reverse proxy', description: 'Nginx · TLS', x: 310, y: 245, color: COLORS[5] },
      { id: 'api', iconId: 'api', title: 'API Backend', description: 'Node.js / REST', x: 550, y: 245, color: COLORS[0] },
      { id: 'database', iconId: 'database', title: 'PostgreSQL', description: 'Persistance', x: 810, y: 104, color: COLORS[3] },
      { id: 'cache', iconId: 'cache', title: 'Redis', description: 'Cache applicatif', x: 810, y: 390, color: COLORS[4] },
      { id: 'monitor', iconId: 'monitoring', title: 'Observabilité', description: 'Logs & métriques', x: 550, y: 505, color: COLORS[2] }
    ],
    edges: [
      { id: 'e1', from: 'client', to: 'proxy', label: 'HTTPS' },
      { id: 'e2', from: 'proxy', to: 'api', label: ':3000' },
      { id: 'e3', from: 'api', to: 'database', label: 'SQL' },
      { id: 'e4', from: 'api', to: 'cache', label: 'TCP' },
      { id: 'e5', from: 'api', to: 'monitor', label: 'metrics' }
    ]
  });

  let project = loadSavedProject() || demoProject();
  let view = { x: 70, y: 70, zoom: 1 };
  let selection = null; // { kind: 'node' | 'edge', id }
  let mode = 'select';
  let isSpaceDown = false;
  let interaction = null;
  let pendingSourceId = null;
  let past = [];
  let future = [];
  let toastTimer;
  const contextMenu = createContextMenu($('context-menu')); 

  function loadSavedProject() {
    try {
      const value = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      return value ? validateProject(JSON.parse(value)) : null;
    } catch (error) {
      console.warn('Projet enregistré illisible, chargement du modèle.', error);
      return null;
    }
  }

  function validateProject(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      throw new Error('Format de projet invalide.');
    }
    if (data.nodes.length > 400 || data.edges.length > 1000 || (data.customIcons || []).length > 50) {
      throw new Error('Le fichier dépasse les limites du POC.');
    }
    const customIcons = (data.customIcons || []).map((icon) => {
      if (typeof icon.id !== 'string' || !/^custom-[a-z\d-]{1,75}$/i.test(icon.id) ||
          typeof icon.dataUrl !== 'string' || !/^data:image\/svg\+xml(?:;charset=[\w-]+)?(?:;base64)?,/i.test(icon.dataUrl) || icon.dataUrl.length > 700000) {
        throw new Error('Une icône SVG du projet est invalide.');
      }
      return { id: icon.id, name: String(icon.name || 'Icône').slice(0, 60), group: 'Mes SVG', color: '#ecedfb', dataUrl: icon.dataUrl };
    });
    const validIcons = new Set([...presetIcons.map((icon) => icon.id), ...customIcons.map((icon) => icon.id), 'note']);
    const nodeIds = new Set();
    const nodes = data.nodes.map((node) => {
      if (typeof node.id !== 'string' || !/^[\w-]{1,90}$/.test(node.id) || nodeIds.has(node.id) ||
          !validIcons.has(node.iconId) || !Number.isFinite(node.x) || !Number.isFinite(node.y) ||
          Math.abs(node.x) > 5000 || Math.abs(node.y) > 5000) {
        throw new Error('Un composant du projet est invalide.');
      }
      nodeIds.add(node.id);
      return { id: node.id, iconId: node.iconId, title: String(node.title || '').slice(0, 60),
        description: String(node.description || '').slice(0, 180), x: node.x, y: node.y,
        color: COLORS.includes(node.color) ? node.color : COLORS[0] };
    });
    const edgeIds = new Set();
    const edges = data.edges.map((edge) => {
      if (typeof edge.id !== 'string' || !/^[\w-]{1,90}$/.test(edge.id) || edgeIds.has(edge.id) ||
          !nodeIds.has(edge.from) || !nodeIds.has(edge.to) || edge.from === edge.to) {
        throw new Error('Une connexion du projet est invalide.');
      }
      edgeIds.add(edge.id);
      return { id: edge.id, from: edge.from, to: edge.to, label: String(edge.label || '').slice(0, 50) };
    });
    return { version: 1, name: String(data.name || 'Nouveau schéma').slice(0, 70), customIcons, nodes, edges };
  }

  function iconFor(id) {
    return presetIcons.find((icon) => icon.id === id) || project.customIcons.find((icon) => icon.id === id);
  }

  function makeIconElement(id) {
    const icon = iconFor(id);
    const container = document.createElement('span');
    if (!icon) return container;
    if (icon.dataUrl) {
      const image = document.createElement('img');
      image.alt = '';
      image.src = icon.dataUrl;
      image.draggable = false;
      container.appendChild(image);
    } else {
      // Only self-authored, static SVG markup is inserted into the DOM.
      container.innerHTML = icon.svg;
    }
    return container;
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove('visible'), 3100);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      $('saved-indicator').textContent = 'Enregistré';
    } catch (error) {
      $('saved-indicator').textContent = 'Stockage saturé';
      showToast('Stockage local saturé : exportez votre projet en JSON.');
      console.warn(error);
    }
  }

  function recordChange(previous) {
    past.push(previous || deepCopy(project));
    if (past.length > 50) past.shift();
    future = [];
  }

  function changeProject(mutation) {
    const before = deepCopy(project);
    mutation();
    recordChange(before);
    redraw();
    save();
  }

  function undo() {
    if (!past.length) return;
    future.push(deepCopy(project));
    project = past.pop();
    selection = null;
    pendingSourceId = null;
    redraw();
    save();
  }

  function redo() {
    if (!future.length) return;
    past.push(deepCopy(project));
    project = future.pop();
    selection = null;
    pendingSourceId = null;
    redraw();
    save();
  }

  function renderPalette() {
    const query = ui.search.value.trim().toLocaleLowerCase('fr');
    const filtered = [...presetIcons, ...project.customIcons].filter((icon) => `${icon.name} ${icon.group}`.toLocaleLowerCase('fr').includes(query));
    $('icon-count').textContent = String(presetIcons.length + project.customIcons.length);
    ui.palette.replaceChildren();
    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'no-results';
      empty.textContent = 'Aucune icône trouvée.';
      ui.palette.appendChild(empty);
      return;
    }
    const groups = new Map();
    filtered.forEach((icon) => {
      if (!groups.has(icon.group)) groups.set(icon.group, []);
      groups.get(icon.group).push(icon);
    });
    for (const [name, icons] of groups) {
      const heading = document.createElement('div');
      heading.className = 'group-label';
      heading.textContent = name;
      const grid = document.createElement('div');
      grid.className = 'palette-grid';
      for (const icon of icons) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'palette-item';
        item.draggable = true;
        item.dataset.iconId = icon.id;
        item.title = `${icon.name} · cliquer ou glisser sur le tableau`;
        const image = document.createElement('span');
        image.className = 'palette-image';
        image.appendChild(makeIconElement(icon.id));
        const title = document.createElement('span');
        title.textContent = icon.name;
        item.append(image, title);
        item.addEventListener('click', () => addNode(icon.id));
        item.addEventListener('dragstart', (event) => {
          event.dataTransfer.setData('application/x-archcanvas-icon', icon.id);
          event.dataTransfer.setData('text/plain', icon.id);
          event.dataTransfer.effectAllowed = 'copy';
        });
        grid.appendChild(item);
      }
      ui.palette.append(heading, grid);
    }
  }

  function applyView() {
    ui.world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`;
    ui.board.style.backgroundSize = `${25 * view.zoom}px ${25 * view.zoom}px`;
    ui.board.style.backgroundPosition = `${view.x}px ${view.y}px`;
    $('zoom-value').textContent = `${Math.round(view.zoom * 100)}%`;
  }

  function renderNodes() {
    ui.nodes.replaceChildren();
    for (const node of project.nodes) {
      const isNote = node.iconId === 'note';
      const element = document.createElement('div');
      element.className = `architecture-node${isNote ? ' note-node' : ''}${selection?.kind === 'node' && selection.id === node.id ? ' selected' : ''}`;
      element.dataset.nodeId = node.id;
      element.style.left = `${node.x}px`;
      element.style.top = `${node.y}px`;
      element.style.setProperty('--tile-bg', node.color);
      element.title = `${node.title}${node.description ? ` · ${node.description}` : ''}`;
      if (isNote) {
        const mark = document.createElement('span');
        mark.className = 'note-icon';
        mark.textContent = '✳';
        element.appendChild(mark);
      } else {
        const icon = document.createElement('div');
        icon.className = 'node-icon';
        icon.appendChild(makeIconElement(node.iconId));
        element.appendChild(icon);
      }
      const title = document.createElement('span');
      title.className = 'node-name';
      title.textContent = node.title;
      const description = document.createElement('span');
      description.className = 'node-subtitle';
      description.textContent = node.description;
      element.append(title, description);
      if (!isNote) {
        for (const type of ['input', 'output']) {
          const port = document.createElement('span');
          port.className = `port ${type}${type === 'output' && pendingSourceId === node.id ? ' pending' : ''}`;
          port.dataset.port = type;
          port.title = type === 'output' ? 'Démarrer une connexion' : 'Terminer une connexion';
          element.appendChild(port);
        }
      }
      element.addEventListener('pointerdown', onNodePointerDown);
      ui.nodes.appendChild(element);
    }
    $('board-placeholder').hidden = project.nodes.length > 0;
    $('node-count').textContent = `${project.nodes.length} composant${project.nodes.length === 1 ? '' : 's'}`;
  }

  function getEndpoints(fromId, toId) {
    const from = project.nodes.find((node) => node.id === fromId);
    const to = project.nodes.find((node) => node.id === toId);
    if (!from || !to) return null;
    return { x1: from.x + NODE_W, y1: from.y + 68, x2: to.x, y2: to.y + 68 };
  }

  function bezier(x1, y1, x2, y2) {
    const bend = Math.max(68, Math.abs(x2 - x1) * .52);
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
  }

  function svgElement(tag, attrs = {}) {
    const element = document.createElementNS(svgNs, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
    return element;
  }

  function renderEdges() {
    ui.edges.replaceChildren();
    for (const edge of project.edges) {
      const point = getEndpoints(edge.from, edge.to);
      if (!point) continue;
      const d = bezier(point.x1, point.y1, point.x2, point.y2);
      const group = svgElement('g', { class: `edge-group${selection?.kind === 'edge' && selection.id === edge.id ? ' selected' : ''}`, 'data-edge-id': edge.id });
      group.appendChild(svgElement('path', { d, class: 'edge-hit' }));
      group.appendChild(svgElement('path', { d, class: 'edge-path' }));
      if (edge.label) {
        const cx = (point.x1 + point.x2) / 2;
        const cy = (point.y1 + point.y2) / 2;
        const labelWidth = Math.min(200, edge.label.length * 7 + 18);
        group.appendChild(svgElement('rect', { x: cx - labelWidth / 2, y: cy - 11, width: labelWidth, height: 22, rx: 7, class: 'edge-label-bg' }));
        const text = svgElement('text', { x: cx, y: cy, class: 'edge-label-text' });
        text.textContent = edge.label;
        group.appendChild(text);
      }
      group.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
        select({ kind: 'edge', id: edge.id });
      });
      ui.edges.appendChild(group);
    }
    $('edge-count').textContent = `${project.edges.length} connexion${project.edges.length === 1 ? '' : 's'}`;
  }

  function updatePreview(point) {
    ui.preview.replaceChildren();
    if (!pendingSourceId) return;
    const from = project.nodes.find((node) => node.id === pendingSourceId);
    if (!from) return;
    const x1 = from.x + NODE_W;
    const y1 = from.y + 68;
    const x2 = point?.x ?? x1 + 90;
    const y2 = point?.y ?? y1;
    ui.preview.appendChild(svgElement('path', { d: bezier(x1, y1, x2, y2), class: 'preview-path' }));
  }

  function renderInspector() {
    const node = selection?.kind === 'node' ? project.nodes.find((item) => item.id === selection.id) : null;
    const edge = selection?.kind === 'edge' ? project.edges.find((item) => item.id === selection.id) : null;
    ui.inspectorEmpty.hidden = Boolean(node || edge);
    ui.nodeInspector.hidden = !node;
    ui.edgeInspector.hidden = !edge;
    if (node) {
      const icon = $('selected-icon');
      icon.replaceChildren();
      if (node.iconId === 'note') icon.textContent = '✳';
      else icon.appendChild(makeIconElement(node.iconId));
      $('selected-type').textContent = node.iconId === 'note' ? 'Note' : iconFor(node.iconId)?.name || 'Composant';
      $('node-title').value = node.title;
      $('node-description').value = node.description;
      const choices = $('color-choices');
      choices.replaceChildren();
      for (const color of COLORS) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = `color-choice${node.color === color ? ' active' : ''}`;
        item.style.background = color;
        item.setAttribute('aria-label', `Choisir la couleur ${color}`);
        item.addEventListener('click', () => {
          changeProject(() => { node.color = color; });
          renderInspector();
        });
        choices.appendChild(item);
      }
    }
    if (edge) $('edge-label').value = edge.label;
  }

  function redraw() {
    ui.name.value = project.name;
    renderPalette();
    renderNodes();
    renderEdges();
    updatePreview();
    renderInspector();
    applyView();
  }

  function select(value) {
    selection = value;
    renderNodes();
    renderEdges();
    renderInspector();
  }

  function pointToWorld(clientX, clientY) {
    const rect = ui.board.getBoundingClientRect();
    return { x: (clientX - rect.left - view.x) / view.zoom, y: (clientY - rect.top - view.y) / view.zoom };
  }

  function positionForNewNode() {
    const rect = ui.board.getBoundingClientRect();
    const center = pointToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { x: clamp(Math.round(center.x - NODE_W / 2), 0, CANVAS_W - NODE_W),
      y: clamp(Math.round(center.y - NODE_H / 2), 0, CANVAS_H - NODE_H) };
  }

  function addNode(iconId, coords) {
    if (project.nodes.length >= 400) return showToast('Limite de 400 composants atteinte.');
    const icon = iconFor(iconId);
    if (!icon && iconId !== 'note') return;
    const pos = coords || positionForNewNode();
    const node = { id: uid(), iconId, title: icon?.name || 'Note', description: iconId === 'note' ? 'Ajoutez une annotation ici.' : '',
      x: clamp(pos.x, 0, CANVAS_W - NODE_W), y: clamp(pos.y, 0, CANVAS_H - NODE_H), color: iconId === 'note' ? COLORS[3] : COLORS[0] };
    changeProject(() => project.nodes.push(node));
    select({ kind: 'node', id: node.id });
    showToast('Composant ajouté.');
  }

  function completeConnection(fromId, toId) {
    pendingSourceId = null;
    ui.preview.replaceChildren();
    if (fromId === toId) return showToast('Une connexion doit relier deux composants différents.');
    if (project.edges.some((edge) => edge.from === fromId && edge.to === toId)) return showToast('Cette connexion existe déjà.');
    const from = project.nodes.find((node) => node.id === fromId);
    const to = project.nodes.find((node) => node.id === toId);
    if (!from || !to || from.iconId === 'note' || to.iconId === 'note') return;
    const edge = { id: uid(), from: fromId, to: toId, label: '' };
    changeProject(() => project.edges.push(edge));
    select({ kind: 'edge', id: edge.id });
    showToast('Connexion créée. Vous pouvez lui ajouter un libellé.');
  }

  function onNodePointerDown(event) {
    if (event.button !== 0) return;
    const element = event.currentTarget;
    const nodeId = element.dataset.nodeId;
    const port = event.target.closest('.port');
    if (port && !isSpaceDown && mode !== 'pan') {
      event.stopPropagation();
      event.preventDefault();
      if (port.dataset.port === 'input') {
        if (pendingSourceId) completeConnection(pendingSourceId, nodeId);
        return;
      }
      pendingSourceId = nodeId;
      interaction = { kind: 'connect', moved: false, startClientX: event.clientX, startClientY: event.clientY };
      renderNodes();
      updatePreview(pointToWorld(event.clientX, event.clientY));
      return;
    }
    if (isSpaceDown || mode === 'pan') return;
    event.stopPropagation();
    event.preventDefault();
    pendingSourceId = null;
    updatePreview();
    select({ kind: 'node', id: nodeId });
    const node = project.nodes.find((item) => item.id === nodeId);
    interaction = { kind: 'move', nodeId, x: node.x, y: node.y,
      startClientX: event.clientX, startClientY: event.clientY, before: deepCopy(project), moved: false };
  }

  function onPointerMove(event) {
    if (!interaction) {
      if (pendingSourceId) updatePreview(pointToWorld(event.clientX, event.clientY));
      return;
    }
    if (interaction.kind === 'pan') {
      view.x = interaction.x + event.clientX - interaction.startClientX;
      view.y = interaction.y + event.clientY - interaction.startClientY;
      applyView();
    } else if (interaction.kind === 'move') {
      const node = project.nodes.find((item) => item.id === interaction.nodeId);
      if (!node) return;
      const dx = (event.clientX - interaction.startClientX) / view.zoom;
      const dy = (event.clientY - interaction.startClientY) / view.zoom;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) interaction.moved = true;
      node.x = clamp(Math.round(interaction.x + dx), 0, CANVAS_W - NODE_W);
      node.y = clamp(Math.round(interaction.y + dy), 0, CANVAS_H - NODE_H);
      const element = [...ui.nodes.children].find((item) => item.dataset.nodeId === node.id);
      if (element) { element.style.left = `${node.x}px`; element.style.top = `${node.y}px`; }
      renderEdges();
    } else if (interaction.kind === 'connect') {
      if (Math.hypot(event.clientX - interaction.startClientX, event.clientY - interaction.startClientY) > 6) interaction.moved = true;
      updatePreview(pointToWorld(event.clientX, event.clientY));
    }
  }

  function onPointerUp(event) {
    if (!interaction) return;
    const last = interaction;
    interaction = null;
    if (last.kind === 'move' && last.moved) {
      const node = project.nodes.find((item) => item.id === last.nodeId);
      if (node && (node.x !== last.x || node.y !== last.y)) {
        recordChange(last.before);
        save();
      }
    }
    if (last.kind === 'connect') {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.port.input');
      const targetNode = target?.closest('[data-node-id]')?.dataset.nodeId;
      if (targetNode && pendingSourceId) {
        completeConnection(pendingSourceId, targetNode);
      } else {
        updatePreview();
        renderNodes();
        if (last.moved) showToast('Cliquez sur un port d’entrée pour terminer la connexion.');
      }
    }
  }

  function zoomAt(factor, clientX, clientY) {
    const rect = ui.board.getBoundingClientRect();
    const old = pointToWorld(clientX, clientY);
    const zoom = clamp(view.zoom * factor, .28, 2.2);
    view.x = clientX - rect.left - old.x * zoom;
    view.y = clientY - rect.top - old.y * zoom;
    view.zoom = zoom;
    applyView();
  }

  function fitToContent() {
    const rect = ui.board.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    if (!project.nodes.length) {
      view = { x: 70, y: 80, zoom: 1 };
    } else {
      const minX = Math.min(...project.nodes.map((node) => node.x));
      const minY = Math.min(...project.nodes.map((node) => node.y));
      const maxX = Math.max(...project.nodes.map((node) => node.x + NODE_W));
      const maxY = Math.max(...project.nodes.map((node) => node.y + NODE_H));
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      const zoom = clamp(Math.min((rect.width - 105) / contentWidth, (rect.height - 130) / contentHeight), .3, 1.15);
      view = { zoom, x: (rect.width - contentWidth * zoom) / 2 - minX * zoom,
        y: (rect.height - contentHeight * zoom) / 2 - minY * zoom };
    }
    applyView();
  }

  function deleteSelection() {
    if (!selection) return;
    const selected = selection;
    changeProject(() => {
      if (selected.kind === 'node') {
        project.nodes = project.nodes.filter((node) => node.id !== selected.id);
        project.edges = project.edges.filter((edge) => edge.from !== selected.id && edge.to !== selected.id);
      } else {
        project.edges = project.edges.filter((edge) => edge.id !== selected.id);
      }
    });
    select(null);
    showToast('Élément supprimé.');
  }

  function duplicateNode() {
    const node = project.nodes.find((item) => item.id === selection?.id && selection?.kind === 'node');
    if (!node) return;
    const copy = { ...deepCopy(node), id: uid(), title: `${node.title} copie`.slice(0, 60),
      x: clamp(node.x + 35, 0, CANVAS_W - NODE_W), y: clamp(node.y + 40, 0, CANVAS_H - NODE_H) };
    changeProject(() => project.nodes.push(copy));
    select({ kind: 'node', id: copy.id });
  }

  function downloadBlob(name, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function fileBaseName() {
    return (project.name.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 55) || 'architecture');
  }

  function exportJson() {
    downloadBlob(`${fileBaseName()}.json`, new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }));
    showToast('Projet JSON exporté.');
  }

  function createExportSvg() {
    if (!project.nodes.length) throw new Error('Ajoutez au moins un composant avant d’exporter.');
    const minX = Math.min(...project.nodes.map((node) => node.x)) - 64;
    const minY = Math.min(...project.nodes.map((node) => node.y)) - 75;
    const maxX = Math.max(...project.nodes.map((node) => node.x + NODE_W)) + 64;
    const maxY = Math.max(...project.nodes.map((node) => node.y + NODE_H)) + 70;
    const w = maxX - minX;
    const h = maxY - minY;
    const fragments = [`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${minX} ${minY} ${w} ${h}">`,
      '<defs><marker id="export-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" stroke="#8996ac" stroke-width="1.5" fill="none"/></marker></defs>',
      `<rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="#ffffff"/>`];
    for (const edge of project.edges) {
      const p = getEndpoints(edge.from, edge.to);
      if (!p) continue;
      fragments.push(`<path d="${bezier(p.x1, p.y1, p.x2, p.y2)}" fill="none" stroke="#8996ac" stroke-width="2.5" marker-end="url(#export-arrow)"/>`);
      if (edge.label) {
        const cx = (p.x1 + p.x2) / 2;
        const cy = (p.y1 + p.y2) / 2;
        const width = Math.min(200, edge.label.length * 7 + 18);
        fragments.push(`<rect x="${cx - width / 2}" y="${cy - 12}" width="${width}" height="24" rx="7" fill="white" stroke="#e1e5ef"/>`);
        fragments.push(`<text x="${cx}" y="${cy + 4}" font-family="Arial,sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="#66748c">${escapeXml(edge.label)}</text>`);
      }
    }
    for (const node of project.nodes) {
      const x = node.x;
      const y = node.y;
      const note = node.iconId === 'note';
      fragments.push(`<rect x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="15" stroke="${note ? '#e5c878' : '#e2e7f0'}" stroke-width="2" fill="${note ? '#fff3c8' : '#ffffff'}"/>`);
      if (!note) {
        const icon = iconFor(node.iconId);
        fragments.push(`<rect x="${x + 38}" y="${y + 9}" width="82" height="73" rx="13" fill="${escapeXml(node.color)}"/>`);
        if (icon?.svg) fragments.push(`<svg x="${x + 45}" y="${y + 12}" width="68" height="68" viewBox="0 0 100 100">${icon.svg}</svg>`);
        if (icon?.dataUrl) fragments.push(`<image x="${x + 45}" y="${y + 12}" width="68" height="68" href="${escapeXml(icon.dataUrl)}"/>`);
      }
      if (note) fragments.push(`<text x="${x + 16}" y="${y + 30}" font-size="18" fill="#b78d3f">✳</text>`);
      const textY = y + (note ? 58 : 108);
      fragments.push(`<text x="${note ? x + 16 : x + NODE_W / 2}" y="${textY}" font-size="13" font-family="Arial,sans-serif" font-weight="bold" text-anchor="${note ? 'start' : 'middle'}" fill="#2b3956">${escapeXml(node.title.slice(0, 26))}</text>`);
      fragments.push(`<text x="${note ? x + 16 : x + NODE_W / 2}" y="${textY + 19}" font-size="10" font-family="Arial,sans-serif" text-anchor="${note ? 'start' : 'middle'}" fill="#8693a6">${escapeXml(node.description.slice(0, 25))}</text>`);
    }
    fragments.push('</svg>');
    return { content: fragments.join(''), width: w, height: h };
  }

  async function exportPng() {
    try {
      const exportData = createExportSvg();
      const blob = new Blob([exportData.content], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      try {
        const image = new Image();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = () => reject(new Error('Impossible de produire le PNG avec ces SVG.'));
          image.src = url;
        });
        const scale = Math.min(2, 5000 / Math.max(exportData.width, exportData.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(exportData.width * scale);
        canvas.height = Math.round(exportData.height * scale);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas 2D indisponible.');
        context.scale(scale, scale);
        context.drawImage(image, 0, 0, exportData.width, exportData.height);
        const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!png) throw new Error('Impossible de générer le fichier PNG.');
        downloadBlob(`${fileBaseName()}.png`, png);
        showToast('Image PNG exportée.');
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Échec de l’export PNG.');
    }
  }

  async function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Lecture SVG impossible.'));
      reader.readAsDataURL(file);
    });
  }

  async function addCustomSvgFiles(files) {
    let count = 0;
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.svg') || file.size > 180000 || file.size === 0) {
        showToast(`Fichier ignoré : ${file.name} (SVG, 180 Ko maximum).`);
        continue;
      }
      if (project.customIcons.length >= 50) { showToast('Limite de 50 icônes importées atteinte.'); break; }
      try {
        const text = await file.text();
        const documentSvg = new DOMParser().parseFromString(text, 'image/svg+xml');
        if (documentSvg.querySelector('parsererror') || documentSvg.documentElement.localName !== 'svg') throw new Error('SVG mal formé.');
        // Keep icons as <img>, never paste a third-party SVG into page HTML.
        // Remove active content, event handlers, and external references before saving it.
        documentSvg.querySelectorAll('script,foreignObject,iframe,object,embed,video,audio').forEach((element) => element.remove());
        documentSvg.querySelectorAll('style').forEach((element) => {
          if (/@import|url\s*\(/i.test(element.textContent)) element.remove();
        });
        for (const element of [documentSvg.documentElement, ...documentSvg.querySelectorAll('*')]) {
          for (const attribute of [...element.attributes]) {
            const value = attribute.value.trim();
            if (/^on/i.test(attribute.name) || /^javascript:/i.test(value) ||
                (/^(href|xlink:href)$/i.test(attribute.name) && !value.startsWith('#')) ||
                /url\s*\(\s*['"]?\s*(https?:|file:|javascript:)/i.test(value) ||
                (element.localName === 'style' && /@import|url\s*\(/i.test(element.textContent))) {
              element.removeAttribute(attribute.name);
            }
          }
        }
        const sanitized = new XMLSerializer().serializeToString(documentSvg.documentElement);
        const sanitizedFile = new File([sanitized], 'icon.svg', { type: 'image/svg+xml' });
        const dataUrl = await readFileAsDataUrl(sanitizedFile);
        if (dataUrl.length > 700000) throw new Error('SVG trop volumineux.');
        const name = file.name.replace(/\.svg$/i, '').replace(/[-_]+/g, ' ').slice(0, 60) || 'SVG';
        changeProject(() => project.customIcons.push({ id: `custom-${uid()}`, name, group: 'Mes SVG', color: '#ecedfb', dataUrl }));
        count++;
      } catch (error) {
        console.warn(file.name, error);
        showToast(`SVG ignoré : ${file.name}. ${error.message}`);
      }
    }
    if (count) showToast(`${count} icône${count > 1 ? 's' : ''} SVG ajoutée${count > 1 ? 's' : ''} à la bibliothèque.`);
  }

  function setMode(next) {
    mode = next;
    $('select-mode').classList.toggle('active', mode === 'select');
    $('pan-mode').classList.toggle('active', mode === 'pan');
    ui.board.classList.toggle('mode-pan', mode === 'pan');
  }

  function replaceProjectFromDrive(data) {
    const imported = validateProject(data);
    recordChange();
    project = imported;
    selection = null;
    pendingSourceId = null;
    redraw();
    fitToContent();
    save();
  }

  function beginConnectionFrom(nodeId) {
    const source = project.nodes.find((node) => node.id === nodeId);
    if (!source || source.iconId === 'note') return;
    pendingSourceId = nodeId;
    select({ kind: 'node', id: nodeId });
    updatePreview();
    showToast('Clique sur le port d’entrée d’un autre composant pour le relier.');
  }

  function rotateNodeColor(nodeId) {
    const node = project.nodes.find((entry) => entry.id === nodeId);
    if (!node) return;
    const next = COLORS[(COLORS.indexOf(node.color) + 1) % COLORS.length];
    changeProject(() => { node.color = next; });
  }

  function reverseConnection(edgeId) {
    const edge = project.edges.find((entry) => entry.id === edgeId);
    if (!edge) return;
    if (project.edges.some((entry) => entry.id !== edgeId && entry.from === edge.to && entry.to === edge.from)) {
      showToast('Une connexion dans ce sens existe déjà.');
      return;
    }
    changeProject(() => { [edge.from, edge.to] = [edge.to, edge.from]; });
  }

  function openBoardContextMenu(event) {
    if (event.target.closest('.board-toolbox, .zoom-controls')) return;
    event.preventDefault();
    interaction = null;
    const nodeId = event.target.closest('[data-node-id]')?.dataset.nodeId;
    const edgeId = event.target.closest('[data-edge-id]')?.dataset.edgeId;
    if (nodeId) {
      const node = project.nodes.find((entry) => entry.id === nodeId);
      if (!node) return;
      select({ kind: 'node', id: nodeId });
      contextMenu.open({ x: event.clientX, y: event.clientY, heading: node.title, items: [
        { label: '✎  Renommer', run: () => $('node-title').focus() },
        { label: '⧉  Dupliquer', run: duplicateNode },
        { label: '↗  Démarrer une connexion', hidden: node.iconId === 'note', run: () => beginConnectionFrom(nodeId) },
        { label: '◐  Changer la couleur', run: () => rotateNodeColor(nodeId) },
        { label: '✕  Supprimer', danger: true, run: deleteSelection }
      ] });
      return;
    }
    if (edgeId) {
      const edge = project.edges.find((entry) => entry.id === edgeId);
      if (!edge) return;
      select({ kind: 'edge', id: edgeId });
      contextMenu.open({ x: event.clientX, y: event.clientY, heading: 'Connexion', items: [
        { label: '✎  Modifier le libellé', run: () => $('edge-label').focus() },
        { label: '⇄  Inverser le sens', run: () => reverseConnection(edgeId) },
        { label: '✕  Supprimer', danger: true, run: deleteSelection }
      ] });
      return;
    }
    select(null);
    const position = pointToWorld(event.clientX, event.clientY);
    const coords = { x: Math.round(position.x - NODE_W / 2), y: Math.round(position.y - NODE_H / 2) };
    contextMenu.open({ x: event.clientX, y: event.clientY, heading: 'Tableau blanc', items: [
      { label: '＋  Ajouter une note ici', run: () => addNode('note', coords) },
      { label: 'ƒ  Ajouter une fonction ici', run: () => addNode('cloud-cloud-function', coords) },
      { label: '▣  Ajouter un conteneur ici', run: () => addNode('cloud-container', coords) },
      { label: '⌗  Ajuster la vue', run: fitToContent },
      { label: '↓  Exporter en JSON', run: exportJson }
    ] });
  }

  function attachEvents() {
    ui.search.addEventListener('input', renderPalette);
    ui.board.addEventListener('contextmenu', openBoardContextMenu);
    ui.name.addEventListener('change', () => {
      const name = ui.name.value.trim().slice(0, 70) || 'Nouveau schéma';
      if (name !== project.name) changeProject(() => { project.name = name; });
    });
    ui.board.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('.architecture-node') && !isSpaceDown && mode !== 'pan') return;
      const inBoard = !event.target.closest('.board-toolbox,.zoom-controls');
      if (!inBoard) return;
      const shouldPan = isSpaceDown || mode === 'pan' || event.target === ui.board || event.target === ui.world || event.target === ui.nodes || event.target.closest('.connections');
      if (!shouldPan) return;
      event.preventDefault();
      if (mode === 'select' && !isSpaceDown && !event.target.closest('.architecture-node')) {
        select(null);
        pendingSourceId = null;
        updatePreview();
      }
      interaction = { kind: 'pan', x: view.x, y: view.y, startClientX: event.clientX, startClientY: event.clientY };
    });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', () => { interaction = null; });
    ui.board.addEventListener('dragover', (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; });
    ui.board.addEventListener('drop', (event) => {
      event.preventDefault();
      const iconId = event.dataTransfer.getData('application/x-archcanvas-icon');
      if (!iconFor(iconId)) return;
      const p = pointToWorld(event.clientX, event.clientY);
      addNode(iconId, { x: Math.round(p.x - NODE_W / 2), y: Math.round(p.y - NODE_H / 2) });
    });
    ui.board.addEventListener('wheel', (event) => {
      event.preventDefault();
      zoomAt(event.deltaY < 0 ? 1.1 : 1 / 1.1, event.clientX, event.clientY);
    }, { passive: false });
    $('select-mode').addEventListener('click', () => setMode('select'));
    $('pan-mode').addEventListener('click', () => setMode('pan'));
    $('add-note-button').addEventListener('click', () => addNode('note'));
    $('fit-button').addEventListener('click', fitToContent);
    $('zoom-in').addEventListener('click', () => { const r = ui.board.getBoundingClientRect(); zoomAt(1.2, r.left + r.width / 2, r.top + r.height / 2); });
    $('zoom-out').addEventListener('click', () => { const r = ui.board.getBoundingClientRect(); zoomAt(1 / 1.2, r.left + r.width / 2, r.top + r.height / 2); });
    $('delete-node-button').addEventListener('click', deleteSelection);
    $('delete-edge-button').addEventListener('click', deleteSelection);
    $('duplicate-button').addEventListener('click', duplicateNode);
    const updateSelectedField = (property, value) => {
      const item = (selection?.kind === 'node' ? project.nodes : project.edges).find((entry) => entry.id === selection?.id);
      if (!item || item[property] === value) return;
      recordChange();
      item[property] = value;
      renderNodes();
      renderEdges();
      save();
    };
    $('node-title').addEventListener('change', (event) => updateSelectedField('title', event.target.value.trim().slice(0, 60) || 'Sans titre'));
    $('node-description').addEventListener('change', (event) => updateSelectedField('description', event.target.value.slice(0, 180)));
    $('edge-label').addEventListener('change', (event) => updateSelectedField('label', event.target.value.slice(0, 50)));
    $('new-button').addEventListener('click', () => {
      if (project.nodes.length && !window.confirm('Créer un tableau vierge ? Le projet actuel reste récupérable uniquement si vous l’avez exporté.')) return;
      recordChange();
      project = { version: 1, name: 'Nouvelle architecture', nodes: [], edges: [], customIcons: deepCopy(project.customIcons) };
      selection = null;
      redraw();
      fitToContent();
      save();
      showToast('Nouveau tableau créé.');
    });
    $('export-json-button').addEventListener('click', exportJson);
    $('export-png-button').addEventListener('click', exportPng);
    $('open-button').addEventListener('click', () => $('project-file').click());
    $('project-file').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      event.target.value = '';
      if (!file) return;
      if (file.size > 12_000_000) return showToast('Le projet JSON est trop volumineux.');
      try {
        const imported = validateProject(JSON.parse(await file.text()));
        recordChange();
        project = imported;
        selection = null;
        pendingSourceId = null;
        redraw();
        fitToContent();
        save();
        showToast('Projet importé avec succès.');
      } catch (error) { showToast(`Import impossible : ${error.message}`); }
    });
    $('import-icons-button').addEventListener('click', () => $('svg-files').click());
    $('svg-files').addEventListener('change', async (event) => {
      const files = [...event.target.files];
      event.target.value = '';
      await addCustomSvgFiles(files);
    });
    window.addEventListener('keydown', (event) => {
      const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (editing) return;
      if (event.key === 'Escape') contextMenu.close();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault(); redo();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault(); deleteSelection();
      } else if (event.key === 'Escape') {
        pendingSourceId = null; interaction = null; updatePreview(); select(null);
      } else if (event.key === ' ' && !event.repeat) {
        event.preventDefault(); isSpaceDown = true; ui.board.classList.add('mode-pan');
      } else if (event.key.toLowerCase() === 'v') setMode('select');
      else if (event.key.toLowerCase() === 'h') setMode('pan');
    });
    window.addEventListener('keyup', (event) => {
      if (event.key === ' ') { isSpaceDown = false; ui.board.classList.toggle('mode-pan', mode === 'pan'); }
    });
    window.addEventListener('blur', () => { isSpaceDown = false; interaction = null; });
    window.addEventListener('resize', applyView);
  }

  attachEvents();
  redraw();
  mountIdentity({ getProject: () => deepCopy(project), applyProject: replaceProjectFromDrive, notify: showToast });
  requestAnimationFrame(fitToContent);
  try {
    if (!localStorage.getItem(STORAGE_KEY)) save();
  } catch (error) {
    console.warn('Stockage local inaccessible dans ce contexte.', error);
  }
})();
