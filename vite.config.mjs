import {readFileSync} from 'node:fs';
import {copyFile, cp, mkdir, rename} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import {explicitThemeVars, highContrastVars, themeOverrideAttr} from '@sustainablewebsites/verdant-design/theme';
import {fontFamilyTokens, fontSizeTokens, radiiTokens, spacingTokens} from '@sustainablewebsites/verdant-design/tokens';

function declarations(tokens, prefix = '') {
  return Object.entries(tokens).map(([key, value]) => {
    const name = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    return `${prefix}${name}:${value}`;
  }).join(';');
}

function verdantHomepage() {
  const base = [
    declarations(explicitThemeVars.light),
    declarations(fontFamilyTokens, '--font-'),
    declarations(fontSizeTokens, '--type-'),
    declarations(radiiTokens, '--radius-'),
    declarations(spacingTokens, '--space-'),
  ].join(';');
  const systemTheme = `:root:not([${themeOverrideAttr}])`;
  const light = `:root[${themeOverrideAttr}="light"]`;
  const dark = `:root[${themeOverrideAttr}="dark"]`;
  const css = [
    `:root{color-scheme:light dark;${base}}`,
    `@media(prefers-color-scheme:dark){${systemTheme}{${declarations(explicitThemeVars.dark)}}}`,
    `${light}{color-scheme:light}`,
    `${dark}{color-scheme:dark;${declarations(explicitThemeVars.dark)}}`,
    `@media(prefers-contrast:more){${systemTheme},${light}{${declarations(highContrastVars.light)}}${dark}{${declarations(highContrastVars.dark)}}}`,
    `@media(prefers-color-scheme:dark) and (prefers-contrast:more){${systemTheme}{${declarations(highContrastVars.dark)}}}`,
  ].join('');
  const runtime = readFileSync(new URL(import.meta.resolve('@sustainablewebsites/verdant-design/theme-toggle.js')), 'utf8');

  return {
    name: 'verdant-homepage',
    transformIndexHtml(_html, {filename}) {
      if (['home.html', 'integrate.html'].some(file => filename.endsWith(`/${file}`))) {
        return [
          {tag: 'script', children: runtime, injectTo: 'head'},
          {tag: 'style', children: css, injectTo: 'head'},
        ];
      }
    },
  };
}

function siteEntrypoints() {
  return {
    name: 'chartiles-site-entrypoints',
    enforce: 'post',
    async writeBundle({dir}) {
      // Avoid Netlify normalizing links to the map's index.html to the homepage.
      await rename(join(dir, 'index.html'), join(dir, 'inspect.html'));
      await rename(join(dir, 'home.html'), join(dir, 'index.html'));

      const talkSource = fileURLToPath(new URL('./talks/cugos/', import.meta.url));
      const talkOutput = join(dir, 'cugos');
      await mkdir(talkOutput, {recursive: true});
      await Promise.all([
        copyFile(join(talkSource, 'index.html'), join(talkOutput, 'index.html')),
        cp(join(talkSource, 'assets'), join(talkOutput, 'assets'), {recursive: true}),
      ]);
    },
  };
}

export default defineConfig(({mode}) => ({
  root: 'web',
  base: './',
  plugins: [verdantHomepage(), ...(mode === 'site' ? [siteEntrypoints()] : [])],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Keep index.html as the entry point for offline bundles and fixture tests.
    ...(mode === 'site' && {
      rolldownOptions: {
        input: ['index.html', 'home.html', 'integrate.html'].map(file =>
          fileURLToPath(new URL(`./web/${file}`, import.meta.url))),
      },
    }),
  },
  server: {host: '127.0.0.1'},
  preview: {host: '127.0.0.1'},
}));
