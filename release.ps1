# ============================================
# Hamro Church Release Script v1.3.0
# ============================================

$ErrorActionPreference = "Stop"

$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

function Write-Success { Write-Host "[OK] $args" -ForegroundColor $SuccessColor }
function Write-Error { Write-Host "[FAIL] $args" -ForegroundColor $ErrorColor }
function Write-Warning { Write-Host "[WARN] $args" -ForegroundColor $WarningColor }
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor $InfoColor }

# STEP 1: Check directory
Write-Info "Checking current directory..."
if ((Get-Location).Path -ne "C:\Hamro Church") {
    Write-Warning "Not in C:\Hamro Church, switching..."
    Set-Location "C:\Hamro Church"
}
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Wrong folder?"
    exit 1
}
Write-Success "Correct folder"

# STEP 2: Check uncommitted changes
Write-Info "Checking for uncommitted changes..."
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warning "Uncommitted changes found:"
    Write-Host $gitStatus -ForegroundColor $WarningColor
    $response = Read-Host "Commit them now? (y/n)"
    if ($response -eq 'y') {
        git add -A
        git commit -m "Pending changes before v1.3.0"
        Write-Success "Changes committed"
    } else {
        Write-Error "Aborting. Please commit or stash changes."
        exit 1
    }
} else {
    Write-Success "Working tree clean"
}

# STEP 3: Pull latest
Write-Info "Pulling latest code..."
git pull origin main
Write-Success "Code updated"

# STEP 4: Run svelte-check
Write-Info "Running svelte-check..."
npm run test:svelte
if ($LASTEXITCODE -ne 0) {
    Write-Error "svelte-check failed"
    exit 1
}
Write-Success "svelte-check passed"

# STEP 5: Bump version
Write-Info "Bumping version to 1.3.0..."
npm version minor --no-git-tag-version
Write-Success "Version bumped"

# STEP 6: Install dependencies
Write-Info "Installing dependencies (may take a few minutes)..."
npm install
Write-Success "Dependencies installed"

# STEP 7: Create temp drive
Write-Info "Creating X: drive..."
subst X: "C:\Hamro Church"
Set-Location "X:\"
Write-Success "Now on X:\"

# STEP 8: Restore NDI SDK
Write-Info "Restoring NDI SDK..."
node .\node_modules\grandiose\ndi.js
Write-Success "NDI SDK restored"

# STEP 9: Build app
Write-Info "Building app (may take a few minutes)..."
npm run build
Write-Success "Build completed"

# STEP 10: Build installer
Write-Info "Building Windows installer..."
npx electron-builder --config config/building/electron-builder.yaml --publish never
Write-Success "Installer built"

# STEP 11: Return and remove temp drive
Set-Location "C:\Hamro Church"
subst X: /D
Write-Success "Removed X: drive"

# STEP 12: Restore tsconfig files
Write-Info "Restoring tsconfig files..."
git checkout -- config/typescript/tsconfig.electron.prod.json
git checkout -- config/typescript/tsconfig.server.prod.json
git checkout -- config/typescript/tsconfig.svelte.prod.json
Write-Success "tsconfig files restored"

# STEP 13: Verify installer
$installer = ".\dist\HamroChurch-1.3.0-x64.exe"
if (Test-Path $installer) {
    $size = [math]::Round((Get-Item $installer).Length / 1MB, 2)
    Write-Success "Installer found: $installer ($size MB)"
} else {
    Write-Error "Installer not found at $installer"
    exit 1
}

# STEP 14: Commit version bump
Write-Info "Committing version bump..."
git add package.json package-lock.json
git commit -m "Release v1.3.0"
Write-Success "Committed"

# STEP 15: Create tag
Write-Info "Creating tag v1.3.0..."
git tag -a v1.3.0 -m "Hamro Church v1.3.0"
Write-Success "Tag created"

# STEP 16: Push to GitHub
Write-Info "Pushing to GitHub..."
git push origin main
git push origin v1.3.0
Write-Success "Pushed to GitHub"

# DONE
Write-Host ""
Write-Host "============================================================" -ForegroundColor $SuccessColor
Write-Host "RELEASE v1.3.0 COMPLETED SUCCESSFULLY" -ForegroundColor $SuccessColor
Write-Host "============================================================" -ForegroundColor $SuccessColor
Write-Host ""
Write-Info "Next steps:"
Write-Host "1. Go to: https://github.com/Hamro-Church/HamroChurch/actions"
Write-Host "2. Wait for 'Build and Release' workflow to finish"
Write-Host "3. Go to: https://github.com/Hamro-Church/HamroChurch/releases"
Write-Host "4. Download HamroChurch-1.3.0-x64.exe from the v1.3.0 release"
Write-Host ""