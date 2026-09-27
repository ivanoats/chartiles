function parseByteRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  // Ignore unsupported syntax, including multiple ranges.
  if (!match || !(match[1] || match[2])) return undefined;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
    return {invalid: true};
  }
  return {offset: start, length: end - start + 1};
}

function requestRange(request, metadata) {
  const value = request.headers.get('Range');
  const ifRange = request.headers.get('If-Range');
  if (request.method !== 'GET' || !value) return undefined;
  if (ifRange && ifRange !== metadata.httpEtag) return undefined;
  return parseByteRange(value, metadata.size);
}

// Public, read-only chart delivery. Bucket writes remain authenticated.
export default {
  async fetch(request, env) {
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, If-Match, If-None-Match, If-Range',
      'Access-Control-Expose-Headers': 'ETag, Content-Range, Accept-Ranges, Content-Length',
      'Access-Control-Max-Age': '3600',
      'Cache-Control': 'no-store',
    });
    const reply = (status, body = null) => new Response(body, {status, headers});
    if (request.method === 'OPTIONS') return reply(204);
    if (!['GET', 'HEAD'].includes(request.method)) {
      headers.set('Allow', 'GET, HEAD, OPTIONS');
      return reply(405);
    }
    const key = new URL(request.url).pathname.slice(1);
    if (!/^charts\/(?:manifest\.json|[a-f0-9]{64}(?:\.pmtiles|-coverage\.(?:json|geojson)))$/.test(key)) {
      return reply(404);
    }
    const metadata = await env.CHARTS.head(key);
    if (!metadata) return reply(404);
    metadata.writeHttpMetadata(headers);
    headers.set('ETag', metadata.httpEtag);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Last-Modified', metadata.uploaded.toUTCString());
    const matches = (value, weak = false) => value?.split(',').some(tag => {
      tag = tag.trim();
      return tag === '*' || (weak ? tag.replace(/^W\//, '') : tag) === metadata.httpEtag;
    });
    if (request.headers.has('If-Match') && !matches(request.headers.get('If-Match'))) return reply(412);
    if (matches(request.headers.get('If-None-Match'), true)) return reply(304);
    const range = requestRange(request, metadata);
    if (range?.invalid) {
      headers.set('Content-Range', `bytes */${metadata.size}`);
      headers.set('Cache-Control', 'no-store');
      return reply(416);
    }
    headers.set('Content-Length', String(range?.length ?? metadata.size));
    if (request.method === 'HEAD') return reply(200);
    const object = await env.CHARTS.get(key, {range, onlyIf: {etagMatches: metadata.etag}});
    if (!object?.body) {
      headers.delete('Content-Length');
      headers.set('Cache-Control', 'no-store');
      return reply(503);
    }
    if (range) headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`);
    return reply(range ? 206 : 200, object.body);
  },
};
