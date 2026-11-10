import { clampGroupDelta } from './multi-select.js';

export function createPastedItems(clipboard, limits, nodeSize, createId) {
  const offset = (clipboard.pasteCount + 1) * 35;
  const delta = clipboard.nodes.length
    ? clampGroupDelta(clipboard.nodes, offset, offset, limits.maxX, limits.maxY, nodeSize.width, nodeSize.height, limits.minX, limits.minY)
    : null;
  const nodes = clipboard.nodes.map((node) => ({ ...node, id: createId(), x: node.x + delta.x, y: node.y + delta.y }));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const clusters = clipboard.clusters.map((cluster) => ({ ...cluster, id: createId(),
    x: clamp(cluster.x + offset, limits.minX, limits.maxX - cluster.width),
    y: clamp(cluster.y + offset, limits.minY, limits.maxY - cluster.height) }));
  return { nodes, clusters };
}
