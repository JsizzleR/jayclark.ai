# jayclark.ai

Personal site and essays. Static output built with Eleventy and deployed to GitHub Pages.

## Publish an essay

Drop a Markdown file in `src/essays/` with this front matter, then commit and push to `main`.
The Actions workflow builds and deploys the site.

```markdown
---
title: Essay Title
description: One or two sentences shown on the index and in link previews.
date: 2026-01-31
---
```

Everything below the front matter is ordinary Markdown. Headings get GitHub-style anchor
slugs, so in-document links written for GitHub keep working. A table of contents is built
automatically from the h2 headings.

Then run `npm run og` and commit the generated card alongside the essay. This renders a
1200x630 link preview image to `src/og/<slug>.png` from the essay's front matter, using
Google Chrome via playwright-core. The layout wires the matching `og:image` tag from the
file slug automatically.

## Local preview

```sh
npm install
npm start
```

`npm start` serves the site locally with live reload. `npm run build` writes the static
site to `_site/`.

## Design

The visual language is a terminal console. A near-black surface ramp (page, panel,
raised, soft), hairline rules, zero border radius, zero shadows, and color reserved for
status. The header stays dark in both schemes and carries the one ornament, a neon
condensed wordmark. The light scheme swaps the ramp for off-whites, selected by
`prefers-color-scheme` with a manual toggle override. All tokens live at the top of
`src/assets/style.css`.

Type runs in two registers. The field is monospace, with a sans display face as the
accent for headings and nav. Body prose runs larger than console density, on a centered
39rem measure with generous leading, so long essays read comfortably.

Conventions worth keeping. Tables are ruled bottom-only and scroll inside a wrapper div,
never the page. Code blocks scroll inside their own container. The layout is a centered
reading column with the header and footer rules spanning wider. Mobile overrides only
tighten values, never loosen them.

## House style

No em dashes anywhere. Use a comma, a full stop, or restructure the sentence. En dashes
in date ranges are fine. Keep colons rare. Plain, concrete sentences, no buzzwords.

## Domain

The site serves at https://jayclark.ai. The `CNAME` file is copied into the published
output, and the apex points at the four GitHub Pages A records. Enforce HTTPS in the
repo's Pages settings once the certificate is issued.
