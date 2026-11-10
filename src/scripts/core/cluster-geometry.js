export function clusterBounds(start, end, minimumSize = 80, limits = null) {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const startX = limits ? clamp(start.x, limits.minX, limits.maxX) : start.x;
  const startY = limits ? clamp(start.y, limits.minY, limits.maxY) : start.y;
  const endX = limits ? clamp(end.x, limits.minX, limits.maxX) : end.x;
  const endY = limits ? clamp(end.y, limits.minY, limits.maxY) : end.y;
  const x = limits ? Math.min(Math.min(startX, endX), limits.maxX - minimumSize) : Math.min(startX, endX);
  const y = limits ? Math.min(Math.min(startY, endY), limits.maxY - minimumSize) : Math.min(startY, endY);
  return {
    x,
    y,
    width: Math.max(minimumSize, Math.max(startX, endX) - x),
    height: Math.max(minimumSize, Math.max(startY, endY) - y)
  };
}
