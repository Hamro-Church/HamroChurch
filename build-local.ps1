$ErrorActionPreference = 'Stop'

Set-Location 'C:\Hamro Church'

git pull
npm install --ignore-scripts

subst X: /d 2>$null
subst X: 'C:\Hamro Church'

Push-Location 'X:\'

try {
    npm run rebuild:native
    npm run build
    npx electron-builder --config config/building/electron-builder.yaml --publish never
}
finally {
    Pop-Location
    Set-Location 'C:\Hamro Church'
    git restore .\config\typescript\tsconfig.electron.prod.json .\config\typescript\tsconfig.server.prod.json .\config\typescript\tsconfig.svelte.prod.json 2>$null
    subst X: /d 2>$null
}

Write-Host 'Installer created at dist\HamroChurch-1.2.0-x64.exe'