export const EDGE_LINE_TYPES = ['arrow-right', 'arrow-left', 'arrow-both', 'dotted'];

export function normalizeEdgeLineType(value) {
  return EDGE_LINE_TYPES.includes(value) ? value : 'arrow-right';
}

export function edgeLineSvgAttributes(lineType, markerId) {
  switch (normalizeEdgeLineType(lineType)) {
    case 'arrow-left':
      return { 'marker-start': `url(#${markerId}-start)` };
    case 'arrow-both':
      return { 'marker-start': `url(#${markerId}-start)`, 'marker-end': `url(#${markerId})` };
    case 'dotted':
      return { 'stroke-dasharray': '3 6' };
    default:
      return { 'marker-end': `url(#${markerId})` };
  }
}
