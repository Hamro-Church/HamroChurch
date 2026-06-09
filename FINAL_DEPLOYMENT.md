# Final Deployment Status

## Changes Made

- Added a reusable Nepali typing engine in `src/lib/nepaliTyping.ts`.
- Added a global typing toggle with `Ctrl+Alt+N` and a Nepali typing tips popup.
- Wired Nepali typing into shared text inputs, textarea components, drawer search, hymns search, notes, and the slide editor contenteditable path.
- Reworked the Hymns drawer layout to match the requested image more closely:
  - single-select left categories with counts
  - center hymn table with number, title, and transliteration
  - right-side hymn info panel with lyrics and insert/copy/favorite actions
- Added hymn metadata support: transliteration, slide count, word count, repeat-chorus indicator, and source timestamps.
- Added a startup safeguard that recreates the Nepali Bible from the Mandali SQLite source if the generated local Bible file is missing.
- Bumped the app version to `1.1.0`.
- Added `build-local.ps1` for one-command local Windows packaging.
- Updated `.github/workflows/release.yml` to handle tagged releases and website deployment from `main`.
- Fixed `.github/workflows/deploy-website.yml` so it can be used manually without the previous workflow-file issue.
- Updated website docs and download links, and added `website/docs/nepali-typing/index.html`.

## Commands To Run

### Local build

```powershell
Set-Location 'C:\Hamro Church'
.\build-local.ps1
```

### Push code

```powershell
Set-Location 'C:\Hamro Church'
git push origin main
git push origin refs/tags/v1.1.0
```

### Create or update release

```powershell
Set-Location 'C:\Hamro Church'
gh release create v1.1.0 .\dist\HamroChurch-1.1.0-x64.exe --repo Hamro-Church/HamroChurch --title "Hamro Church v1.1.0" --notes "Added Nepali typing, improved hymns UI, Nepali Bible integration."
```

If the release already exists:

```powershell
gh release upload v1.1.0 .\dist\HamroChurch-1.1.0-x64.exe .\dist\HamroChurch-1.1.0-x64.exe.blockmap .\dist\latest.yml --repo Hamro-Church/HamroChurch --clobber
```

## URLs

- GitHub repo: `https://github.com/Hamro-Church/HamroChurch`
- Release page: `https://github.com/Hamro-Church/HamroChurch/releases/tag/v1.1.0`
- Website: `https://hamrocms.com`

## Website Deploy Checklist

1. Ensure FTP or SSH deployment secrets are configured in GitHub Actions if you want automatic deploy from `main`.
2. If you deploy manually, upload the full contents of `website/` to the web root for `hamrocms.com`.
3. Confirm the download page points to the `v1.1.0` installer URL.

## Troubleshooting

- If the local build removes `config/typescript/tsconfig.*.prod.json`, run:

```powershell
git restore .\config\typescript\tsconfig.electron.prod.json .\config\typescript\tsconfig.server.prod.json .\config\typescript\tsconfig.svelte.prod.json
```

- If the Nepali Bible is missing, verify the source file exists at `C:\Mandali Show\church-presentation-app\data\library.sqlite`.
- If the hymns JSON is missing, verify `C:\Mandali Show\church-presentation-app\data\nepali_hymns.json` exists.
- If website deploy fails, run the manual workflow or upload the `website/` folder directly through your hosting control panel.