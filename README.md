# TEXTORA

Write Better. Think Smarter. Create Faster.

Created by Arif H.

## Phase 1

This is the free-first static MVP of TEXTORA. It contains the complete public UI, tool interfaces, pricing, legal pages and demo mode.

## Run locally

No build system is required for this first version.

Open `index.html` in a browser, or use a local static server.

Example with Python:

```bash
python -m http.server 8000
```

Then open http://localhost:8000

## Deploy

This project can be deployed as a static site to Cloudflare Pages, GitHub Pages or Netlify.

## Important

The tool pages are intentionally in Demo Mode until a secure server-side AI provider is configured. Never expose an API key in browser JavaScript.

## Next phase

Add Cloudflare Pages Functions/serverless endpoints and connect one AI provider to the Paraphraser first. Then reuse the API adapter for the other tools.
