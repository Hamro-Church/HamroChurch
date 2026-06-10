# Hamro Church v1.2.0

## Fixes And New Features

- Removed the `Favorites only` filter from the Hymns panel.
- Hymn search filters live while typing and matches Nepali title, transliteration, number, and lyrics.
- Clicking a hymn now inserts it immediately into the current project flow.
- Added `Add New Hymn` dialog with persistent JSON save support.
- Added reusable Nepali typing engine with `Ctrl+Alt+N` toggle and tips popup.
- Added a visible manual `Check for updates` button in the top bar.
- Reworked the About dialog and removed the main remaining user-facing FreeShow branding.
- Added bundled Bible and hymn source resources for installer seeding.
- Added startup recovery for the Nepali Bible if the generated local Bible file is missing.
- Added website docs for Nepali typing, adding hymns, and Bible navigation.

## Local Build

Run one command from PowerShell:

```powershell
Set-Location 'C:\Hamro Church'
.\build-v1.2.0.ps1
```

Expected installer output:

```powershell
dist\HamroChurch-1.2.0-x64.exe
```

## GitHub Push And Release

```powershell
Set-Location 'C:\Hamro Church'
git push origin main
git tag -f v1.2.0
git push origin refs/tags/v1.2.0 --force
gh release create v1.2.0 .\dist\HamroChurch-1.2.0-x64.exe --repo Hamro-Church/HamroChurch --title "Hamro Church v1.2.0" --notes "Added Nepali typing, improved hymns UI, bundled Bible/hymn resources, and Bible reliability fixes."
```

If the release already exists:

```powershell
gh release upload v1.2.0 .\dist\HamroChurch-1.2.0-x64.exe .\dist\HamroChurch-1.2.0-x64.exe.blockmap .\dist\latest.yml --repo Hamro-Church/HamroChurch --clobber
```

## Website Upload

Manual upload remains the fallback when GitHub deployment secrets are not configured.

1. Upload everything inside `website/` to the web root of `hamrocms.com`.
2. Or upload the release asset zip if one was generated for the website bundle.
3. Verify these pages:
   - `/download/`
   - `/docs/nepali-typing/`
   - `/docs/adding-hymns/`
   - `/docs/bible-navigation/`

## Verification Checklist

- Hymns panel has no `Favorites only` box.
- Clicking a hymn inserts it immediately.
- `Add New Hymn` saves and survives restart.
- `Ctrl+Alt+N` toggles Nepali typing.
- Bible panel opens Nepali books and localized verse numbers.
- `Check for updates` button opens the updater UI.
- Installer contains bundled hymn and Bible source resources.

## URLs

- Repo: `https://github.com/Hamro-Church/HamroChurch`
- Release: `https://github.com/Hamro-Church/HamroChurch/releases/tag/v1.2.0`
- Website: `https://hamrocms.com`