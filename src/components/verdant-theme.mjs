import {readFileSync} from 'node:fs';
import {explicitThemeVars, highContrastVars, themeOverrideAttr} from '@sustainablewebsites/verdant-design/theme';
import {fontFamilyTokens, fontSizeTokens, radiiTokens, spacingTokens} from '@sustainablewebsites/verdant-design/tokens';
  const runtime = readFileSync(new URL(import.meta.resolve('@sustainablewebsites/verdant-design/theme-toggle.js')), 'utf8');

function declarations(tokens, prefix = '') {
  return Object.entries(tokens).map(([key, value]) => {
    const name = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    return `${prefix}${name}:${value}`;
  }).join(';');
}

export function verdantTheme() {
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

  return {css, runtime};
}
