import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import {explicitThemeVars, highContrastVars} from '@sustainablewebsites/verdant-design/theme';
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
  const css = [
    `:root{color-scheme:light dark;${base}}`,
    `@media(prefers-color-scheme:dark){:root{${declarations(explicitThemeVars.dark)}}}`,
    `@media(prefers-contrast:more){:root{${declarations(highContrastVars.light)}}}`,
    `@media(prefers-color-scheme:dark) and (prefers-contrast:more){:root{${declarations(highContrastVars.dark)}}}`,
  ].join('');

  return {
    name: 'verdant-homepage',
    transformIndexHtml(_html, {filename}) {
      if (['home.html', 'integrate.html'].some(file => filename.endsWith(`/${file}`))) {
        return [{tag: 'style', children: css, injectTo: 'head'}];
      }
    },
  };
}

export default defineConfig(({mode}) => ({
  root: 'web',
  base: './',
  plugins: [verdantHomepage()],
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
