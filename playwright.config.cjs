const {defineConfig} = require('@playwright/test');
module.exports = defineConfig({testDir: './tests/browser', use: {baseURL: 'http://127.0.0.1:4173', viewport: {width: 1280, height: 850}}, webServer: {command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: true}});
