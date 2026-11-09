export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'src/styles': 'styles' });
  eleventyConfig.addPassthroughCopy({ 'src/scripts': 'scripts' });
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.ignores.add('tests/**');
  eleventyConfig.ignores.add('docs/**');
  return {
    dir: { input: '.', output: 'dist', includes: '_includes', data: '_data' },
    templateFormats: ['html', 'njk'],
    htmlTemplateEngine: 'njk'
  };
}
