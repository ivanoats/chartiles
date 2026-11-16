const {defineConfig} = require('@playwright/test');

const deployedSite = process.env.CHARTILES_SITE_URL;
const localSite = 'http://127.0.0.1:4173';

module.exports = defineConfig({
  testDir: './tests/browser',
  ...(deployedSite && {testMatch: 'homepage.spec.cjs'}),
  use: {baseURL: deployedSite || localSite, viewport: {width: 1280, height: 850}},
  webServer: deployedSite ? undefined : {
    command: 'npm run preview -- --port 4173',
    url: localSite,
    reuseExistingServer: true,
  },
});
