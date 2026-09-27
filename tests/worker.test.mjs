import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../hosting/worker.mjs';
const key = 'a'.repeat(64) + '.pmtiles';
const metadata = {size: 10, httpEtag: '"version"', etag: 'version', uploaded: new Date(0), writeHttpMetadata() {}};
const env = {CHARTS: {head: async () => metadata, get: async (_, {range}) => ({body: range ? '0123456789'.slice(range.offset, range.offset + range.length) : '0123456789'})}};
test('Worker preserves range and conditional request semantics', async () => {
  for (const [method, headers, status, body] of [
    ['GET', {Range:'bytes=2-4'}, 206, '234'], ['GET', {Range:'bytes=-2'}, 206, '89'],
    ['GET', {Range:'bytes=99-'}, 416, ''], ['HEAD', {Range:'bytes=0-1'}, 200, ''],
    ['GET', {Range:'bytes=0-1', 'If-Range':'"stale"'}, 200, '0123456789'],
    ['GET', {'If-None-Match':'"version"'}, 304, ''],
  ]) {
    const response = await worker.fetch(new Request(`https://example.test/charts/${key}`, {method, headers}), env);
    assert.equal(response.status, status); assert.equal(await response.text(), body);
  }
});
