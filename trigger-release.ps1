param(
    [ValidateSet("patch", "minor", "major")]
    [string]$Bump = "patch",

    [switch]$Wait,

    [string]$Remote = "origin"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

function Require-CleanWorkingTree {
    $status = git status --porcelain
    if ($LASTEXITCODE -ne 0) {
        throw "git status failed. Make sure Git is installed and the repository is available."
    }
    if ($status) {
        throw "Working tree is not clean. Commit or stash your changes before running a release."
    }
}

function Require-MainBranch {
    $branch = (git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Could not determine the current branch."
    }
    if ($branch -ne "main") {
        throw "Run trigger-release.ps1 from the main branch so the website deploy workflow also runs. Current branch: $branch"
    }
}

function Wait-ForReleaseWorkflow {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TagName,

        [Parameter(Mandatory = $true)]
        [string]$CommitSha
    )

    $gh = Get-Command gh -ErrorAction SilentlyContinue
    if (-not $gh) {
        Write-Warning "GitHub CLI (gh) is not installed. Skipping workflow wait."
        return
    }

    Write-Host "Waiting for the build-release workflow for $TagName..."

    $runId = $null
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $runId = gh run list --workflow build-release.yml --limit 20 --json databaseId,headSha,event --jq ".[] | select(.event == \"push\" and .headSha == \"$CommitSha\") | .databaseId" | Select-Object -First 1
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to query GitHub Actions runs with gh."
        }
        if ($runId) { break }
        Start-Sleep -Seconds 10
    }

    if (-not $runId) {
        Write-Warning "Could not find the build-release workflow run yet. Check the Actions tab manually."
        return
    }

    gh run watch $runId --exit-status
    if ($LASTEXITCODE -ne 0) {
        throw "The build-release workflow failed. Check the Actions tab for logs."
    }

    $releaseUrl = gh release view $TagName --json url --jq .url
    if ($LASTEXITCODE -ne 0 -or -not $releaseUrl) {
        Write-Warning "The workflow completed, but the release URL could not be fetched automatically."
        return
    }

    Write-Host "Release is live: $releaseUrl"
}

Require-CleanWorkingTree
Require-MainBranch

Write-Host "Bumping version ($Bump)..."
$versionOutput = (npm version $Bump -m "Release %s").Trim()
if ($LASTEXITCODE -ne 0) {
    throw "npm version failed."
}

$tag = $versionOutput
$newVersion = $tag.TrimStart("v")

# electron-builder.yaml does not contain a version key in this repository,
# so npm version updates the relevant package metadata without extra edits here.
Write-Host "New version: $newVersion"

Write-Host "Pushing version bump commit to $Remote..."
git push $Remote HEAD
if ($LASTEXITCODE -ne 0) {
    throw "git push failed."
}

Write-Host "Pushing tag $tag to $Remote..."
git push $Remote --tags
if ($LASTEXITCODE -ne 0) {
    throw "git push --tags failed."
}

$releaseUrl = "https://github.com/Hamro-Church/HamroChurch/releases/tag/$tag"
Write-Host "Expected release URL: $releaseUrl"
Write-Host "The website deploy workflow is triggered by the version-bump push to main."

if ($Wait) {
    $commitSha = (git rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Could not resolve the current commit SHA."
    }

    Wait-ForReleaseWorkflow -TagName $tag -CommitSha $commitSha
} else {
    Write-Host "Use -Wait if you want the script to watch the build-release workflow with GitHub CLI."
}
