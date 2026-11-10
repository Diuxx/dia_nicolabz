export const NODE_MIN_SIZE = { width: 120, height: 141 };
export const CLUSTER_MIN_SIZE = { width: 80, height: 80 };

export function resizeFromBottomRight(item, width, height, minimum, limits) {
  const maxWidth = Math.min(limits.maxX - item.x, limits.maxX - limits.minX);
  const maxHeight = Math.min(limits.maxY - item.y, limits.maxY - limits.minY);
  if (maxWidth < minimum.width || maxHeight < minimum.height) return null;
  return {
    width: Math.min(maxWidth, Math.max(minimum.width, width)),
    height: Math.min(maxHeight, Math.max(minimum.height, height))
  };
}
