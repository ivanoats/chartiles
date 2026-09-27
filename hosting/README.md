# Chart hosting

Netlify serves the viewer at https://chartiles.com. The `/charts/*` redirect
sends browsers to https://chartiles-data.ivanstorck.workers.dev, where a
read-only Worker streams objects from the private `chartiles-charts` R2 bucket.
Netlify continues to manage DNS. CORS is handled by the Worker, including for
Netlify deploy previews. Public bucket access is not required.

## Publish charts

Build and validate the region locally first. Preview the upload commands:

```sh
python3 pipeline/publish_charts.py
```

Upload the current archive and optional coverage audit, then update the manifest:

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

Netlify builds with `npm run build` and publishes `dist`. The generated chart
directory is gitignored and does not need to exist on the Netlify build runner.
The redirect in `netlify.toml` supplies charts independently of frontend builds.
Local Vite development continues to use the local chart bundle.

After publishing, verify the manifest, a PMTiles range returning HTTP 206,
CORS headers, and a browser map load. Offline packages continue to include
their own local chart files.
