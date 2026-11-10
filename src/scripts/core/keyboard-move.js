import { clampGroupDelta } from './multi-select.js';

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }
};

export function keyboardMoveDelta(items, key, fast, limits, defaultSize) {
  const direction = DIRECTIONS[key];
  if (!direction || !items.length) return null;
  const step = fast ? 10 : 1;
  const requestedX = direction.x * step;
  const requestedY = direction.y * step;
  const delta = clampGroupDelta(items, requestedX, requestedY, limits.maxX, limits.maxY,
    defaultSize.width, defaultSize.height, limits.minX, limits.minY);
  const axisDelta = (value, requested, start, end, lower, upper) => {
    if (!requested || (start < lower && end > upper)) return 0;
    if (start < lower) return requested > 0 ? Math.max(0, Math.min(requested, upper - end)) : 0;
    if (end > upper) return requested < 0 ? Math.min(0, Math.max(requested, lower - start)) : 0;
    return value;
  };
  const minX = Math.min(...items.map((item) => item.x));
  const minY = Math.min(...items.map((item) => item.y));
  const maxX = Math.max(...items.map((item) => item.x + (item.width ?? defaultSize.width)));
  const maxY = Math.max(...items.map((item) => item.y + (item.height ?? defaultSize.height)));
  return {
    x: axisDelta(delta.x, requestedX, minX, maxX, limits.minX, limits.maxX),
    y: axisDelta(delta.y, requestedY, minY, maxY, limits.minY, limits.maxY)
  };
}
