// Compose the Astro site with the unchanged standalone Vite viewer and talk.
import {copyFile, cp, mkdir, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const map = await mkdtemp(join(tmpdir(), 'chartiles-map-'));
try {
  // Astro has already copied web/public, including any locally built charts.
  await build({
    configFile: join(root, 'vite.config.mjs'),
    publicDir: false,
    build: {outDir: map, emptyOutDir: true},
  });

  const talk = join(root, 'talks', 'cugos');
  const hostedTalk = join(dist, 'cugos');
  await mkdir(hostedTalk, {recursive: true});
  await Promise.all([
    copyFile(join(map, 'index.html'), join(dist, 'inspect.html')),
    cp(join(map, 'assets'), join(dist, 'assets'), {recursive: true}),
    copyFile(join(talk, 'index.html'), join(hostedTalk, 'index.html')),
    cp(join(talk, 'assets'), join(hostedTalk, 'assets'), {recursive: true}),
  ]);
} finally {
  await rm(map, {recursive: true, force: true});
}
