const designSystemAssets = [
  'styles/theme.css',
  'styles/typography.css',
  'styles/components.css',
  'styles/icons.css',
  'theme.js',
  'components.js',
  'icons/icons.svg'
];

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'src/styles': 'styles' });
  eleventyConfig.addPassthroughCopy({ 'src/scripts': 'scripts' });
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });

  // Keep shared assets in the installed package rather than maintaining local copies.
  for (const asset of designSystemAssets) {
    const fileName = asset.split('/').at(-1);
    eleventyConfig.addPassthroughCopy({
      [`node_modules/@nicolabz/design-system/src/${asset}`]: `design-system/${fileName}`
    });
  }

  eleventyConfig.ignores.add('tests/**');
  eleventyConfig.ignores.add('docs/**');
  return {
    dir: { input: '.', output: 'dist', includes: '_includes', data: '_data' },
    templateFormats: ['html', 'njk'],
    htmlTemplateEngine: 'njk'
  };
}
