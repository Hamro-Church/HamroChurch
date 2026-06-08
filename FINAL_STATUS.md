# Final Status: Hamro Church v1.0.0 Preparation

## Completed Work

- Rebranded the desktop application as Hamro Church
- Kept Nepali and English bilingual behavior in place
- Replaced FreeShow and ChurchApps production links with Hamro Church URLs and GitHub targets
- Added the static Hamro Church website bundle under `website/`
- Created the website deployment guides:
  - `website/DEPLOYMENT.md`
  - `DEPLOY-WEBSITE.md`
- Created the website archive at the project root:
  - `hamro-church-website.zip`
- Created the public GitHub repository:
  - `https://github.com/Hamro-Church/HamroChurch`
- Pushed the codebase to the new GitHub repository
- Created the GitHub release:
  - `https://github.com/Hamro-Church/HamroChurch/releases/tag/v1.0.0`
- Built and uploaded the Windows installer asset:
  - `https://github.com/Hamro-Church/HamroChurch/releases/download/v1.0.0/HamroChurch-1.0.0-x64.exe`
- Updated the website download page to remove `#` placeholders and point to live release destinations

## Validation Results

- `npm run test:svelte`
  - Result: `0 errors, 46 warnings, 189 hints`
- `npm run build`
  - Result: completed successfully

## Critical Link Verification

Verified through source configuration:

- Help → Documentation points to `https://hamrocms.com/docs`
- Help → Report Issue points to `https://github.com/Hamro-Church/HamroChurch/issues`
- About dialog points to `https://hamrocms.com`
- Update checks point to GitHub releases via `https://api.github.com/repos/Hamro-Church/HamroChurch/releases`

## Known Issues / Notes

- `svelte-check` still reports `46 warnings` and `189 hints`
- These remaining items are currently cosmetic or type-quality issues, not hard errors
- Local Windows packaging required two release-config fixes:
  - removing the mandatory Azure signing requirement
  - including `package.json` in the packaged file set
- The GitHub Actions release workflow rerun is active for additional hosted artifacts
- macOS and Linux direct asset URLs are not attached to the release yet at the time of this report
- Until those hosted artifacts finish uploading, the website download page uses the live release page for macOS and Linux instead of broken placeholder links

## URLs

- Website: `https://hamrocms.com`
- Documentation: `https://hamrocms.com/docs`
- FAQ: `https://hamrocms.com/faq`
- Repository: `https://github.com/Hamro-Church/HamroChurch`
- Issues: `https://github.com/Hamro-Church/HamroChurch/issues`
- Release page: `https://github.com/Hamro-Church/HamroChurch/releases/tag/v1.0.0`
- Windows installer: `https://github.com/Hamro-Church/HamroChurch/releases/download/v1.0.0/HamroChurch-1.0.0-x64.exe`

## Next Steps

1. Upload the contents of `website/` to the web root of `hamrocms.com`
2. Verify the live website routes and language toggle
3. Monitor the GitHub Actions release workflow for macOS and Linux artifact uploads
4. Once macOS and Linux assets appear on the release page, update `website/download/index.html` with their direct asset URLs if desired
5. Rebuild `hamro-church-website.zip` and re-upload the updated website files if those direct links are added later

## Release Preparation Commits

- `344bd6cd` — Prepare for v1.0.0 release
- `38cdb885` — Fix release packaging configuration