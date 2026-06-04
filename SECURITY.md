# Security Notes

This is a static React/Vite portfolio. It does not collect secrets, accept form
submissions, call external APIs, or render user-provided HTML.

## Current hardening

- Dependencies are pinned to exact versions in `package.json`.
- `package-lock.json` is committed and should be used with `npm ci`.
- `.npmrc` keeps future dependency saves exact.
- `npm audit --audit-level=moderate` currently reports 0 vulnerabilities.
- Blog search and terminal commands are client-side only and render through
  React text nodes, not `dangerouslySetInnerHTML`.
- No `eval`, `Function`, or manual `innerHTML` usage exists in `src`.
- `public/_headers` defines CSP and browser security headers for hosts that
  support `_headers` files, such as Netlify and Cloudflare Pages.
- `index.html` includes a fallback CSP and referrer policy.

## Deploy checklist

Use HTTPS only. Add HSTS at the hosting layer after confirming HTTPS works:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Install in CI with:

```bash
npm ci
npm audit --audit-level=moderate
npm run build
```

Do not add markdown/HTML blog rendering without sanitizing it first. If blog
content later comes from a CMS, API, or user input, treat it as untrusted data.
