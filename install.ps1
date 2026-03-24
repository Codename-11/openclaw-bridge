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

    if (!(Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null }
    if (!(Test-Path $BinDir)) { New-Item -ItemType Directory -Path $BinDir -Force | Out-Null }

    if (Test-Path "$InstallDir\.git") {
        Write-Ok "Updating existing installation..."
        Push-Location $InstallDir
        git pull --quiet
        Pop-Location
    } else {
        if (Test-Path $InstallDir) { Remove-Item -Recurse -Force $InstallDir }
        git clone --quiet $RepoUrl $InstallDir
    }

    # Install runtime dependencies
    Write-Ok "Installing dependencies..."
    Push-Location $InstallDir
    npm install --omit=dev --no-optional --ignore-scripts 2>$null
    Pop-Location

    # Create batch wrappers
    $appPath = $InstallDir -replace '\\', '/'

    Set-Content "$BinDir\openclaw-bridge-mcp.cmd" "@echo off`nnode `"$InstallDir\dist\modules\mcp\index.js`" %*"
    Set-Content "$BinDir\openclaw-bridge.cmd" "@echo off`nnode `"$InstallDir\bin\openclaw-bridge.mjs`" %*"
    Set-Content "$BinDir\openclaw-bridge-setup.cmd" "@echo off`nnode -e `"require('$appPath/dist/cli/setup.js').runSetup().catch(e=>{console.error(e);process.exit(1)})`""

    # Add to PATH if not already there
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$BinDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$BinDir", "User")
        $env:Path = "$env:Path;$BinDir"
        Write-Ok "Added to PATH: $BinDir"
    }

    Write-Ok "Installed to: $InstallDir"

    # Auto-register MCP with Claude Code (user scope = all projects)
    Write-Step "Registering MCP with Claude Code..."
    $mcpCmd = "$BinDir\openclaw-bridge-mcp.cmd"
    try { & claude mcp remove openclaw 2>$null } catch {}
    try { & claude mcp remove --scope user openclaw 2>$null } catch {}
    try {
        & claude mcp add --scope user openclaw -- $mcpCmd
        Write-Ok "MCP registered (user scope — all projects)"
    } catch {
        Write-Warn "Could not auto-register MCP. Run manually:"
        Write-Host "   claude mcp add --scope user openclaw -- $mcpCmd" -ForegroundColor White
    }

    # Auto-run setup
    Write-Step "Running setup wizard..."
    node -e "require('$appPath/dist/cli/setup.js').runSetup().catch(e=>{console.error(e);process.exit(1)})"
}

function Uninstall-Bridge {
    Write-Step "Uninstalling openclaw-bridge..."

    try { & claude mcp remove openclaw 2>$null } catch {}
    Write-Ok "Removed MCP from Claude Code"

    if (Test-Path $InstallDir) {
        Remove-Item -Recurse -Force $InstallDir
        Write-Ok "Removed: $InstallDir"
    }

    if (Test-Path $BinDir) {
        Remove-Item -Recurse -Force $BinDir
        Write-Ok "Removed: $BinDir"
    }

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

    # Refresh bin wrappers
    $appPath = $InstallDir -replace '\\', '/'
    Set-Content "$BinDir\openclaw-bridge-mcp.cmd" "@echo off`nnode `"$InstallDir\dist\modules\mcp\index.js`" %*"
    Set-Content "$BinDir\openclaw-bridge.cmd" "@echo off`nnode `"$InstallDir\bin\openclaw-bridge.mjs`" %*"
    Set-Content "$BinDir\openclaw-bridge-setup.cmd" "@echo off`nnode -e `"require('$appPath/dist/cli/setup.js').runSetup().catch(e=>{console.error(e);process.exit(1)})`""

    Write-Ok "Updated to latest"
}

function Setup-Bridge {
    if (!(Test-Path "$InstallDir\dist\cli\setup.js")) {
        Write-Warn "Not installed. Installing first..."
        Install-Bridge
        return
    }
    $appPath = $InstallDir -replace '\\', '/'
    node -e "require('$appPath/dist/cli/setup.js').runSetup().catch(e=>{console.error(e);process.exit(1)})"
}

switch ($Action.ToLower()) {
    "install"   { Install-Bridge }
    "update"    { Update-Bridge }
    "uninstall" { Uninstall-Bridge }
    "setup"     { Setup-Bridge }
    default     { Install-Bridge }
}
