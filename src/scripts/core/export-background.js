export function exportBackgroundSvg(background, bounds) {
  const { x, y, width, height } = bounds;
  const rectangle = `<rect x="${x}" y="${y}" width="${width}" height="${height}"`;
  if (background === 'white') return `${rectangle} fill="#ffffff"/>`;
  if (background === 'dotted') {
    return '<defs><pattern id="export-dots" patternUnits="userSpaceOnUse" width="25" height="25"><circle cx="12.5" cy="12.5" r="1.1" fill="#dce2ee"/></pattern></defs>'
      + `${rectangle} fill="#fcfdff"/>${rectangle} fill="url(#export-dots)"/>`;
  }
  throw new Error('Fond d’export PNG inconnu.');
}
