# Release Instructions

Use this checklist when you want to publish a new Windows installer and deploy the website with the least manual work.

## 1. Configure GitHub once

### Required repository settings

1. Open the GitHub repository settings for `Hamro-Church/HamroChurch`.
2. Go to `Settings -> Actions -> General`.
3. Make sure Actions are enabled.
4. Under `Workflow permissions`, select `Read and write permissions`.
5. Save the change.

### Website deployment secrets

Pick one deployment method and configure only that secret set.

#### Option A: FTP

Add these repository secrets under `Settings -> Secrets and variables -> Actions`:

- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `REMOTE_DIR`

#### Option B: SSH + rsync

Add these repository secrets under `Settings -> Secrets and variables -> Actions`:

- `SSH_PRIVATE_KEY`
- `REMOTE_HOST`
- `REMOTE_USER`
- `TARGET`

Do not configure both FTP and SSH secrets at the same time. The website workflow will fail on purpose if both secret sets are present.

## 2. Start a release locally

From the repository root, run one of these commands:

```powershell
.\trigger-release.ps1 patch
.\trigger-release.ps1 minor
.\trigger-release.ps1 major
```

What the script does:

1. Verifies that the Git working tree is clean.
2. Verifies that you are on `main`.
3. Runs `npm version patch|minor|major`.
4. Creates the version-bump commit and Git tag.
5. Pushes the commit to `origin/main`.
6. Pushes the new tag.

Optional:

```powershell
.\trigger-release.ps1 patch -Wait
```

If GitHub CLI (`gh`) is installed and authenticated, `-Wait` watches the `build-release.yml` workflow and prints the release URL when it finishes.

## 3. Watch GitHub Actions

After the script pushes the tag:

1. Open the repository `Actions` tab.
2. Wait for `Build and Release` to finish.
3. Confirm that a new GitHub Release was created for the pushed tag.

The workflow will:

1. Build the Windows installer on `windows-latest`.
2. Upload the generated `.exe`, `.blockmap`, and `latest*.yml` files as artifacts.
3. Publish a GitHub Release for the tag using `softprops/action-gh-release`.

## 4. Website deployment

The website deploy is triggered by the version-bump commit pushed to `main`.

If the deployment secrets are configured:

1. Open the `Deploy Website` workflow in the Actions tab.
2. Confirm that it selected the expected method (`FTP` or `SSH`).
3. Wait for the deploy job to finish.

If you have not configured website secrets yet:

1. The workflow will skip deployment.
2. Add the secrets later.
3. Re-run `Deploy Website` manually from the Actions tab.

## 5. Test the release

After the GitHub Release is live:

1. Open the release page.
2. Download the Windows `.exe` installer.
3. Install it on a clean or test machine.
4. Verify these release-critical features:
   - Nepali Bible is present after installation.
   - Nepali hymns are present after installation.
   - Hymn edits survive app restart.
   - The `Reset to original` option restores the bundled hymns and Bible.

## Troubleshooting

### `trigger-release.ps1` says the working tree is not clean

Commit or stash your changes first, then rerun the script.

### The GitHub Release is not created

Check these items:

1. The `Build and Release` workflow ran from a tag like `v1.2.1`.
2. `Settings -> Actions -> General -> Workflow permissions` is set to `Read and write permissions`.
3. The `publish_release` job completed successfully.

### The Windows build fails during dependency install or NDI restore

Open the `Build and Release` workflow logs and inspect these steps:

1. `Install dependencies`
2. `Restore the NDI SDK for grandiose`
3. `Build production bundles`
4. `Build installer artifacts`

The workflow already installs Python 3.12 and restores the NDI SDK with `node .\node_modules\grandiose\ndi.js`.

### The website workflow says deployment is not configured

Add one secret set only:

- FTP: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `REMOTE_DIR`
- SSH: `SSH_PRIVATE_KEY`, `REMOTE_HOST`, `REMOTE_USER`, `TARGET`

### The website workflow fails with a conflict error

Both deployment methods are configured. Remove one secret set so only FTP or SSH remains.

### The download page still points to an old release

The site now fetches the latest release from the GitHub API on page load. If the page still looks stale:

1. Hard refresh the browser.
2. Confirm the GitHub Release exists.
3. Confirm the website deploy workflow finished successfully.

### I want to deploy the website manually

You can upload the contents of the `website/` folder to your host manually. The folder is a complete static site bundle.