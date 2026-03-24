# openclaw-bridge installer for Windows
# Usage: irm https://raw.githubusercontent.com/Codename-11/openclaw-bridge/main/install.ps1 | iex
# Or: .\install.ps1 [install|update|uninstall|setup]

param(
    [string]$Action = "install"
)

$RepoUrl = "https://github.com/Codename-11/openclaw-bridge.git"
$InstallDir = "$env:USERPROFILE\.openclaw-bridge\app"
$BinDir = "$env:USERPROFILE\.openclaw-bridge\bin"

function Write-Step($msg) { Write-Host "`n=> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "   $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "   $msg" -ForegroundColor Yellow }

function Install-Bridge {
    Write-Step "Installing openclaw-bridge..."

    # Create dirs
    if (!(Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null }
    if (!(Test-Path $BinDir)) { New-Item -ItemType Directory -Path $BinDir -Force | Out-Null }

    # Clone or pull
    if (Test-Path "$InstallDir\.git") {
        Write-Ok "Updating existing installation..."
        Push-Location $InstallDir
        git pull --quiet
        Pop-Location
    } else {
        if (Test-Path $InstallDir) { Remove-Item -Recurse -Force $InstallDir }
        git clone --quiet $RepoUrl $InstallDir
    }

    # Create batch wrapper in bin dir
    @"
@echo off
node "$InstallDir\dist\modules\mcp\index.js" %*
"@ | Set-Content "$BinDir\openclaw-bridge-mcp.cmd"

    @"
@echo off
node -e "require('$($InstallDir -replace '\\', '/')/dist/cli/start.js').runStart(process.argv.slice(1))" -- %*
"@ | Set-Content "$BinDir\openclaw-bridge.cmd"

    @"
@echo off
node -e "require('$($InstallDir -replace '\\', '/')/dist/cli/setup.js').runSetup()"
"@ | Set-Content "$BinDir\openclaw-bridge-setup.cmd"

    # Add to PATH if not already there
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$BinDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$BinDir", "User")
        $env:Path = "$env:Path;$BinDir"
        Write-Ok "Added to PATH: $BinDir"
        Write-Warn "Restart your terminal for PATH to take effect"
    }

    Write-Ok "Installed to: $InstallDir"
    Write-Host ""
    Write-Step "Run setup wizard:"
    Write-Host "   openclaw-bridge-setup" -ForegroundColor White
    Write-Host ""
    Write-Step "Register MCP with Claude Code:"
    Write-Host "   claude mcp add openclaw -- openclaw-bridge-mcp" -ForegroundColor White
    Write-Host ""
}

function Uninstall-Bridge {
    Write-Step "Uninstalling openclaw-bridge..."

    # Remove MCP from Claude Code
    try { claude mcp remove openclaw 2>$null } catch {}
    Write-Ok "Removed MCP from Claude Code"

    # Remove install dir
    if (Test-Path $InstallDir) {
        Remove-Item -Recurse -Force $InstallDir
        Write-Ok "Removed: $InstallDir"
    }

    # Remove bin dir
    if (Test-Path $BinDir) {
        Remove-Item -Recurse -Force $BinDir
        Write-Ok "Removed: $BinDir"
    }

    # Remove config (ask first)
    $configDir = "$env:USERPROFILE\.openclaw-bridge"
    if (Test-Path "$configDir\config.json") {
        $confirm = Read-Host "Remove config at $configDir\config.json? [y/N]"
        if ($confirm -eq 'y') {
            Remove-Item -Recurse -Force $configDir
            Write-Ok "Removed config"
        } else {
            Write-Warn "Config preserved at: $configDir"
        }
    }

    # Clean PATH
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -like "*$BinDir*") {
        $newPath = ($currentPath -split ";" | Where-Object { $_ -ne $BinDir }) -join ";"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        Write-Ok "Removed from PATH"
    }

    Write-Ok "Uninstall complete"
}

function Update-Bridge {
    Write-Step "Updating openclaw-bridge..."
    if (!(Test-Path "$InstallDir\.git")) {
        Write-Warn "Not installed. Run install first."
        return
    }
    Push-Location $InstallDir
    git pull --quiet
    Pop-Location
    Write-Ok "Updated to latest"
}

function Setup-Bridge {
    if (!(Test-Path "$InstallDir\dist\cli\setup.js")) {
        Write-Warn "Not installed. Installing first..."
        Install-Bridge
    }
    node "$InstallDir\dist\cli\setup.js"
}

# Route action
switch ($Action.ToLower()) {
    "install"   { Install-Bridge }
    "update"    { Update-Bridge }
    "uninstall" { Uninstall-Bridge }
    "setup"     { Setup-Bridge }
    default     { Install-Bridge }
}
