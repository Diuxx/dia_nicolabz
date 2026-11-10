export function clusterBounds(start, end, minimumSize = 80) {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.max(minimumSize, Math.abs(end.x - start.x)),
    height: Math.max(minimumSize, Math.abs(end.y - start.y))
  };
}
