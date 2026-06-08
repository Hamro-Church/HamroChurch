# Deploy Hamro Church Website

This repository includes a static website bundle in the `website/` folder.

## What to Upload

Upload the **contents** of the `website/` folder to the web root for `https://hamrocms.com`.

Do not upload the `website/` folder itself as a nested directory unless your host is configured to serve it as the domain root.

### Required structure on the host

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
- `/bible-resources/index.html`
- `/support/index.html`
- `/assets/css/style.css`
- `/assets/js/main.js`
- `/assets/images/*`

## Recommended Permissions

Typical static hosting permissions are:

- Directories: `755`
- Files: `644`

If your host already assigns safe defaults automatically, keep those defaults.

## Upload Steps

1. Create a zip from the `website/` folder if your hosting panel accepts archives.
2. Upload the contents of `website/` to the domain root for `hamrocms.com`.
3. If you uploaded a zip, extract it in the domain root.
4. Confirm that folder routes resolve to `index.html` automatically.

## Post-Upload Test Checklist

Open these URLs in a browser:

- `https://hamrocms.com/`
- `https://hamrocms.com/download/`
- `https://hamrocms.com/docs/`
- `https://hamrocms.com/docs/getting-started/`
- `https://hamrocms.com/docs/interface/`
- `https://hamrocms.com/docs/bible/`
- `https://hamrocms.com/docs/hymns/`
- `https://hamrocms.com/docs/stage-display/`
- `https://hamrocms.com/docs/remote-control/`
- `https://hamrocms.com/faq/`
- `https://hamrocms.com/translations/`
- `https://hamrocms.com/bible-resources/`
- `https://hamrocms.com/support/`

Also verify:

- The language toggle changes visible labels
- Mobile navigation opens and closes correctly
- Footer and header links resolve correctly
- Download buttons point to real release assets once those are published

## Important Note

If you update release URLs later, regenerate the website zip and re-upload the affected files, especially:

- `index.html`
- `download/index.html`