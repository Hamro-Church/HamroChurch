# Hamro Church Website Deployment

The static site files for `hamrocms.com` live in the `website/` folder.

## What to Upload

Upload the **contents** of `website/` to the web root of `hamrocms.com`.

That means these paths should end up live on the domain root:

- `/index.html`
- `/download/index.html`
- `/docs/index.html`
- `/docs/getting-started/index.html`
- `/docs/interface/index.html`
- `/docs/bible/index.html`
- `/docs/hymns/index.html`
- `/docs/stage-display/index.html`
- `/docs/remote-control/index.html`
- `/faq/index.html`
- `/translations/index.html`
- `/support/index.html`
- `/bible-resources/index.html`
- `/assets/css/style.css`
- `/assets/js/main.js`
- `/assets/images/*`

## Standard Hosting Steps

1. Build or export the app site files locally if you have additional preprocessing. For the current version, the files are already static and ready to upload.
2. Copy everything inside `website/` to the document root of your web host.
3. Ensure the host serves nested `index.html` files for folder routes like `/download/` and `/docs/bible/`.
4. If your host requires explicit rewrite rules, enable directory index routing so `/docs/` resolves to `/docs/index.html`.

## GitHub Pages Option

If you later deploy through GitHub Pages or a static hosting pipeline:

1. Publish the contents of `website/` as the site root.
2. Keep the site mounted at the domain root so links like `/docs/` and `/download/` continue working.
3. Point the `hamrocms.com` custom domain to that published site.

## Installer Links

The download buttons currently use placeholder `#` links for direct platform installers.

Replace those placeholders in `website/download/index.html` with the real published assets once your GitHub release artifacts exist:

- Windows: direct `.exe` asset URL
- macOS: direct `.dmg` asset URL
- Linux: direct `.AppImage` or `.deb` asset URL

Keep `https://github.com/Hamro-Church/HamroChurch/releases` listed as the fallback source even after the direct links are updated.

## Recommended Post-Upload Checks

After deployment, verify these URLs in a browser:

- `https://hamrocms.com/`
- `https://hamrocms.com/download/`
- `https://hamrocms.com/docs/`
- `https://hamrocms.com/docs/bible/`
- `https://hamrocms.com/docs/stage-display/`
- `https://hamrocms.com/faq/`
- `https://hamrocms.com/bible-resources/`
- `https://hamrocms.com/translations/`
- `https://hamrocms.com/support/`

Also test the language toggle, mobile navigation, and every footer link after the first upload.