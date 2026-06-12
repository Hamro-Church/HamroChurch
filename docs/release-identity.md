# Release Identity Guide

This guide explains how to make commits, tags, and future releases appear as `Hamro Church` instead of a personal GitHub account.

## Important limitation

Changing Git author and committer names changes commit and tag attribution.
It does **not** change the GitHub release creator label.

GitHub shows the account that created the release page.
To make the release page show `Hamro Church`, create the release while authenticated as a dedicated `Hamro Church` GitHub account or use a Personal Access Token from that account in GitHub Actions.

## 1. Set local Git identity for this repository only

```powershell
Set-Location "C:\Hamro Church"

git config user.name "Hamro Church"
git config user.email "info@hamrocms.com"

git config --local --get-regexp "^user\."
```

If you want GitHub to attribute commits to the `Hamro Church` account, use an email that is verified on that account.

## 2. Create backups before rewriting history

```powershell
Set-Location "C:\Hamro Church"

git bundle create "..\HamroChurch-backup.bundle" --all
git clone --mirror . "..\HamroChurch-mirror-backup.git"
```

Optional full folder backup:

```powershell
Copy-Item "C:\Hamro Church" "C:\Hamro Church Backup" -Recurse
```

## 3. Rewrite author and committer identity in a mirror clone

Install `git-filter-repo` if needed:

```powershell
py -m pip install git-filter-repo
```

Move into the mirror backup:

```powershell
Set-Location "..\HamroChurch-mirror-backup.git"
git log --format="%an <%ae>" --all | Sort-Object -Unique
```

Create a mailmap file that maps old identities to the new one:

```powershell
@'
Hamro Church <info@hamrocms.com> <old-email-1@example.com>
Hamro Church <info@hamrocms.com> <old-email-2@example.com>
'@ | Set-Content .\mailmap.txt
```

Run the rewrite:

```powershell
git filter-repo --force --mailmap .\mailmap.txt
```

Verify the rewritten history:

```powershell
git log --format="%h %an <%ae> | %cn <%ce>" --all | Select-Object -First 20
git for-each-ref refs/tags --format="%(refname:short) %(taggername) <%(taggeremail)>"
```

## 4. Force-push rewritten history

If you are the only maintainer, from the mirror clone:

```powershell
git push --force --mirror origin
```

If you are using a normal clone instead of a mirror clone:

```powershell
git push --force-with-lease origin main
git push --force origin --tags
```

## 5. Risks

1. Every rewritten commit and tag gets a new hash.
2. Existing clones must be recloned or hard-reset.
3. Open pull requests based on old history can break.
4. Existing release pages may still show the old release creator account.
5. Signed commits and tags will no longer be valid.

## 6. Future releases should show `Hamro Church`

1. Create a separate GitHub account named `Hamro Church`.
2. Add that account to the repository with write access.
3. Verify `info@hamrocms.com` or the chosen email on that account.
4. Create a Personal Access Token on that account with `contents:write`.
5. Save it in repository secrets as `HAMRO_CHURCH_RELEASE_TOKEN`.
6. Update `.github/workflows/build-release.yml` so the release action uses that token.

You can set the secret from your terminal with the helper script in this repo:

```powershell
Set-Location "C:\Hamro Church"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-github-secrets.ps1 -SetReleaseToken
```

Example workflow line:

```yaml
token: ${{ secrets.HAMRO_CHURCH_RELEASE_TOKEN }}
```

## 7. Existing release creator label

There is no Git-only command that changes the creator label on an existing GitHub Release.

To change that label, you must delete and recreate the release while signed in as the `Hamro Church` account, or publish the release through GitHub Actions using a token from that account.

## 8. Manual release creation with GitHub CLI

```powershell
gh auth logout
gh auth login

Set-Location "C:\Hamro Church"

gh release create v1.7.3 `
  .\dist\HamroChurch-1.7.3-x64.exe `
  .\dist\HamroChurch-1.7.3-x64.exe.blockmap `
  .\dist\latest.yml `
  --title "v1.7.3" `
  --generate-notes
```

Make sure the authenticated account is the dedicated `Hamro Church` account before you run that command.