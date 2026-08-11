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

## Local preview

```sh
npm install
npm start
```

`npm start` serves the site locally with live reload. `npm run build` writes the static
site to `_site/`.

## Design

The visual language is an engineering drawing. Cyanotype ground with a drafting grid,
chalk ink and hairline rules, one alarm red, a fixed sheet frame, and a titleblock in the
footer. The light scheme is the same drawing rendered as ink on vellum, selected by
`prefers-color-scheme`. All tokens live at the top of `src/assets/style.css`.

Type runs in two registers. Chrome (masthead, nav, stamps, tables, titleblock) uses the
drawing's small monospace scale. Body prose is a larger monospace on a 68ch measure with
generous leading, so long essays read comfortably.

Conventions worth keeping. Every border radius is 0 and every shadow is flat. Tables are
fully ruled and scroll inside a wrapper div, never the page. Code blocks scroll inside
their own container. Mobile overrides only tighten values, never loosen them.

## House style

No em dashes anywhere. Use a comma, a full stop, or restructure the sentence. En dashes
in date ranges are fine. Keep colons rare. Plain, concrete sentences, no buzzwords.

## Domain

The site serves at https://jayclark.ai. The `CNAME` file is copied into the published
output, and the apex points at the four GitHub Pages A records. Enforce HTTPS in the
repo's Pages settings once the certificate is issued.
