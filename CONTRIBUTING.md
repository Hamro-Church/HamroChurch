# Contributing to Hamro Church

Thank you for improving Hamro Church.

## Ways to Contribute

### Report Issues

Use the GitHub issue tracker:

- https://github.com/Hamro-Church/HamroChurch/issues

When reporting a bug, include:

- The Hamro Church version
- Your operating system
- Clear reproduction steps
- Screenshots or screen recordings if useful
- Sample media or scripture/hymn data if the issue depends on content

### Suggest Improvements

Feature requests are welcome through GitHub issues. Be specific about the church workflow you are trying to improve and explain how the feature would be used during a real service.

### Improve Translations

If you find a wording issue in English or Nepali:

- Open an issue describing the exact text and where it appears
- Or submit a pull request with the updated language files under `public/lang`

When changing translations, verify that the wording still fits the UI layout.

### Add or Improve Hymn Content

If you are helping with hymn workflows:

- Keep titles, numbering, and categories consistent
- Avoid duplicate variants unless they are intentionally separate
- Test the lyric flow in Hamro Church after import

### Submit Code Changes

1. Create a branch from `main`.
2. Make focused changes.
3. Run the relevant checks before opening a pull request:
   - `npm run test:svelte`
   - `npm run build`
4. Describe what changed and how it was tested.

## Contribution Standards

- Preserve bilingual Nepali/English behavior
- Do not reintroduce FreeShow or ChurchApps branding
- Keep changes minimal and task-focused
- Document user-facing behavior changes when needed

## Website Contributions

The public site bundle lives in `website/`. If you update site copy or deployment notes, verify:

- Internal links still resolve correctly
- Download and docs URLs stay accurate
- The site remains mobile-friendly

## Questions

If you are unsure where a change belongs, open an issue first and describe the problem you want to solve.