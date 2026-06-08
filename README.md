# Hamro Church

Hamro Church is a bilingual Nepali/English church presentation application for worship services, scripture projection, song lyrics, media playback, stage display, remote control, and multi-output presentations.

## Current Focus

- Full desktop presentation workflow with preview, stage, controller, remote, and output-stream views
- Nepali-first localization with English fallback
- Nepali Bible migration and local scripture support
- Nepali hymn import and slide generation
- Bikram Sambat display formatting and Nepali numerals in key UI surfaces

## Development Setup

1. Install Node.js.
2. Install Python 3.12 and `setuptools`.
3. On Windows, install Visual Studio Build Tools with C++ desktop components and the Windows SDK.
4. On Linux, install `libfontconfig1-dev`.
5. From the repository root, run `npm install`.

## Common Commands

- `npm start`
  Starts the desktop app in development mode.

- `npm run build:frontend:prod`
  Builds the frontend bundle into `public/build`.

- `npm run build:servers:prod`
  Builds the remote, stage, controller, and output-stream bundles into `build/electron`.

- `npm run build:electron:prod`
  Compiles the Electron TypeScript code.

- `npm run build`
  Runs the full production build chain.

- `npm run test:svelte`
  Runs `svelte-check` for Svelte and TypeScript validation.

- `npm run pack`
  Creates an unpacked desktop build for manual packaging verification.

## Manual Verification

Use this checklist after `npm start` or a successful production build:

1. Confirm the shell branding shows Hamro Church in splash, about, and window titles.
2. Open scripture and verify local Bible content loads and inserts into slides.
3. Open imported hymn content and verify Nepali text renders and splits into slides.
4. Check preview, stage, remote, controller, and output-stream views.
5. Verify Nepali number/date formatting in supported UI surfaces.

## Content Maintenance

### Add or Update Hymns

Update the migrated hymn source JSON and regenerate the imported hymn shows through the application migration/import workflow.

### Update the Nepali Bible

Replace the migrated Bible source database and rerun the application migration so the local Bible files are regenerated.

### Extend Translations

Edit the language files under `public/lang` and rerun `npm run test:svelte` plus `npm run build`.

## Build Outputs

- Frontend bundle: `public/build`
- Electron/server build artifacts: `build/electron`
- Packaged app output: produced by `npm run pack` or release packaging commands
