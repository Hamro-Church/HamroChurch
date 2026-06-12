param(
    [Parameter(Mandatory = $true)][string[]]$OldEmails,
    [string]$RepoPath,
    [string]$Branch,
    [string]$RemoteName,
    [string]$NewName,
    [string]$NewEmail,
    [switch]$ForcePush
)

if (-not $RepoPath) { $RepoPath = 'C:\Hamro Church' }
if (-not $Branch) { $Branch = 'main' }
if (-not $RemoteName) { $RemoteName = 'origin' }
if (-not $NewName) { $NewName = 'Hamro Church' }
if (-not $NewEmail) { $NewEmail = 'info@hamrocms.com' }

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$repoItem = Get-Item -LiteralPath $RepoPath
$repoLeaf = $repoItem.Name
$backupRoot = Join-Path $env:USERPROFILE 'HamroChurch-history'
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
$bundlePath = Join-Path $backupRoot "$repoLeaf-history-backup-$timestamp.bundle"
$mirrorPath = Join-Path $backupRoot "$repoLeaf-history-rewrite-$timestamp.git"
$mailmapPath = Join-Path $mirrorPath 'mailmap.txt'

Write-Step 'Checking prerequisites'
git --version | Out-Null
py -m git_filter_repo --help *> $null

Write-Step 'Configuring repository-local Git identity'
Set-Location $RepoPath
git config user.name $NewName
git config user.email $NewEmail

Write-Step 'Creating safety backups'
git bundle create $bundlePath --all
if ($LASTEXITCODE -ne 0) {
    throw "Failed to create bundle backup at $bundlePath"
}
git clone --mirror $RepoPath $mirrorPath | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Failed to create mirror clone at $mirrorPath"
}

Write-Step 'Preparing mailmap'
$mailmapLines = foreach ($oldEmail in $OldEmails) {
    "$NewName <$NewEmail> <$oldEmail>"
}
$mailmapLines | Set-Content -LiteralPath $mailmapPath

Write-Step 'Rewriting history in mirror clone'
Set-Location $mirrorPath
py -m git_filter_repo --force --mailmap $mailmapPath

Write-Step 'Showing sample rewritten history'
git log --format='%h %an <%ae> | %cn <%ce>' --all | Select-Object -First 10

Write-Step 'Showing rewritten taggers'
git for-each-ref refs/tags --format='%(refname:short) %(taggername) <%(taggeremail)>'

if ($ForcePush) {
    Write-Step 'Force-pushing rewritten history'
    git push --force --mirror $RemoteName
} else {
    Write-Step 'Force-push skipped'
    Write-Host 'Review the mirror clone, then run this if you want to publish the rewrite:' -ForegroundColor Yellow
    Write-Host "Set-Location '$mirrorPath'" -ForegroundColor Yellow
    Write-Host "git push --force --mirror $RemoteName" -ForegroundColor Yellow
}

Write-Step 'Done'
Write-Host "Bundle backup: $bundlePath"
Write-Host "Mirror clone:  $mirrorPath"