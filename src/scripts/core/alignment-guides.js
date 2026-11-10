import { clampGroupDelta } from './multi-select.js';

export function alignMovingNodes(moving, others, delta, threshold, limits, defaultSize) {
  const bounded = (x, y) => clampGroupDelta(moving, x, y, limits.maxX, limits.maxY,
    defaultSize.width, defaultSize.height, limits.minX, limits.minY);
  const minimum = bounded(-Infinity, -Infinity);
  const maximum = bounded(Infinity, Infinity);
  const best = { x: null, y: null };
  for (const axis of ['x', 'y']) {
    const dimension = axis === 'x' ? 'width' : 'height';
    const targets = others.map((target) => {
      const start = target[axis];
      const size = target[dimension] ?? defaultSize[dimension];
      return { target, anchors: [start, start + size / 2, start + size] };
    });
    for (const source of moving) {
      const start = source[axis];
      const size = source[dimension] ?? defaultSize[dimension];
      const sourceAnchors = [start, start + size / 2, start + size];
      for (const { target, anchors } of targets) {
        for (const sourceAnchor of sourceAnchors) {
          for (const targetAnchor of anchors) {
            const adjustment = targetAnchor - sourceAnchor - delta[axis];
            if (Math.abs(adjustment) > threshold || (best[axis] && Math.abs(adjustment) >= Math.abs(best[axis].adjustment))) continue;
            const candidate = delta[axis] + adjustment;
            if (candidate < minimum[axis] - 1e-7 || candidate > maximum[axis] + 1e-7) continue;
            best[axis] = { adjustment, coordinate: targetAnchor, source, target };
          }
        }
      }
      if (best[axis]?.adjustment === 0) break;
    }
  }
  const result = { x: delta.x + (best.x?.adjustment ?? 0), y: delta.y + (best.y?.adjustment ?? 0) };
  const guides = [];
  for (const axis of ['x', 'y']) {
    const match = best[axis];
    if (!match) continue;
    const cross = axis === 'x' ? 'y' : 'x';
    const dimension = axis === 'x' ? 'height' : 'width';
    const sourceStart = match.source[cross] + result[cross];
    const targetStart = match.target[cross];
    guides.push({ axis, coordinate: match.coordinate,
      start: Math.min(sourceStart, targetStart),
      end: Math.max(sourceStart + (match.source[dimension] ?? defaultSize[dimension]),
        targetStart + (match.target[dimension] ?? defaultSize[dimension])) });
  }
  return { delta: result, guides };
}
