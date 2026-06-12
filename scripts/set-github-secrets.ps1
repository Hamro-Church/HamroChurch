param(
    [string]$Repo = 'Hamro-Church/HamroChurch',
    [ValidateSet('ftp', 'ssh', 'skip')]
    [string]$WebsiteDeploy = 'skip',
    [switch]$SetReleaseToken
)

$ErrorActionPreference = 'Stop'

function Read-SecretValue([string]$Prompt) {
    $secure = Read-Host -Prompt $Prompt -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    }
    finally {
        if ($ptr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        }
    }
}

function Set-GitHubSecret([string]$Name, [string]$Value) {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Secret '$Name' cannot be empty."
    }

    $Value | gh secret set $Name --repo $Repo
    Write-Host "Set secret: $Name" -ForegroundColor Green
}

gh auth status | Out-Null

if ($SetReleaseToken) {
    $releaseToken = Read-SecretValue 'Paste HAMRO_CHURCH_RELEASE_TOKEN'
    Set-GitHubSecret 'HAMRO_CHURCH_RELEASE_TOKEN' $releaseToken
}

switch ($WebsiteDeploy) {
    'ftp' {
        $ftpServer = Read-SecretValue 'FTP_SERVER'
        $ftpUsername = Read-SecretValue 'FTP_USERNAME'
        $ftpPassword = Read-SecretValue 'FTP_PASSWORD'
        $remoteDir = Read-SecretValue 'REMOTE_DIR'

        Set-GitHubSecret 'FTP_SERVER' $ftpServer
        Set-GitHubSecret 'FTP_USERNAME' $ftpUsername
        Set-GitHubSecret 'FTP_PASSWORD' $ftpPassword
        Set-GitHubSecret 'REMOTE_DIR' $remoteDir
    }
    'ssh' {
        $sshPrivateKey = Read-SecretValue 'SSH_PRIVATE_KEY'
        $remoteHost = Read-SecretValue 'REMOTE_HOST'
        $remoteUser = Read-SecretValue 'REMOTE_USER'
        $target = Read-SecretValue 'TARGET'

        Set-GitHubSecret 'SSH_PRIVATE_KEY' $sshPrivateKey
        Set-GitHubSecret 'REMOTE_HOST' $remoteHost
        Set-GitHubSecret 'REMOTE_USER' $remoteUser
        Set-GitHubSecret 'TARGET' $target
    }
    'skip' {
    }
}

Write-Host 'Done.' -ForegroundColor Cyan