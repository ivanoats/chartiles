# ADR-0010: Use Astro for public content

- **Status:** Accepted
- **Date:** 2026-11-16

## Context

The homepage and integration guide shared Verdant navigation, a theme picker,
and footer markup. Adding a blog created a recurring need to write Markdown,
validate post metadata, and render pages with the same layout. The inspection
map and its offline package already had a working Vite build.

## Decision

Use Astro to build public content as static HTML. Keep the homepage in an Astro
template and write the developer guide and blog posts in Markdown. Use a
content collection to validate blog metadata. Netlify previews render drafts
for review. The production build omits them.

Keep the MapLibre viewer on the existing Vite build and stage it at
`/inspect.html` in the hosted output. Stage the independent CUGOS deck at
`/cugos/`. Offline packaging continues to use the map-only build.

## Consequences

The public site has one Verdant layout and a repeatable path from Markdown
to a rendered post. Hosting remains static. The hosted build now composes two
outputs, so changes need to preserve viewer routes, assets, and chart requests.
The offline bundle remains independent of the public content build.

- [Implementation PR #14](https://github.com/ivanoats/chartiles/pull/14)
- [Site build and hosting instructions](../../hosting/README.md)
