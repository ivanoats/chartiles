# Chart hosting

Netlify serves the viewer at https://chartiles.com. The `/charts/*` redirect
sends browsers to https://chartiles-data.ivanstorck.workers.dev, where a
read-only Worker streams objects from the private `chartiles-charts` R2 bucket.
The viewer resolves archive URLs on the host that served the manifest so
PMTiles byte-range requests reach the Worker directly.
Netlify continues to manage DNS. CORS is handled by the Worker, including for
Netlify deploy previews. Public bucket access is not required.

## Publish charts

Build and validate the region locally first. Preview the upload commands:

```sh
python3 pipeline/publish_charts.py
```

Upload the current vector archive, optional raster archive and coverage audit, then update the manifest:

```sh
python3 pipeline/publish_charts.py --upload
```

The uploader verifies archive size and SHA-256 before writing anything. An
upload failure stops publication before updating the manifest. Archives use
content-addressed names and immutable cache headers; the manifest revalidates.
Coverage files are optional but must be present as a pair. Old archives remain
available; retention cleanup is a separate operation.

## Publish the Worker

```sh
npx --yes wrangler@4.142.0 deploy --config hosting/wrangler.jsonc
```

The Worker permits GET, HEAD, and OPTIONS only, serves single byte ranges,
and restricts access to chart archives, coverage files, and the manifest.
It streams data rather than buffering the whole archive. Each ordinary GET
uses an R2 metadata lookup and read. There is no shared edge cache in this
implementation; browser caching follows the uploaded object metadata.
Worker requests and R2 operations are metered under the account's plans.

## Publish the viewer

Netlify runs `npm run build:site` with Node.js 24 and publishes `dist`.
Astro builds the Verdant pages at `/`, `/integrate/`, and `/blog/`. The
same command stages the Vite inspection map at `/inspect.html` and the
standalone slide deck at `/cugos/`. The chart data stays on its existing host.

To preview the site locally, run `npm run build:site` followed by
`npm run preview`. Run the homepage smoke tests against a deploy preview with
`CHARTILES_SITE_URL=https://your-preview.example npm run test:browser -- homepage`.

Edit the developer guide at `src/content/developer-guide.md` and add posts in
`src/content/blog/`. Each post has a title, description, and date in its Markdown
frontmatter. Set `draft: true` while reviewing a post. Local builds and Netlify
deploy previews render drafts, with a `noindex` tag on each draft page.
Netlify production builds omit draft pages and their listing entries.

The default `npm run build` still builds only the map for offline bundles. The
generated chart directory is gitignored and does not need to exist on the
Netlify build runner. Local Vite development uses the local chart bundle.

After publishing, verify the manifest, a PMTiles range returning HTTP 206,
CORS headers, and a browser map load. Offline packages continue to include
their own local chart files.
