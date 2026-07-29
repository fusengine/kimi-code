# Fusengine Kimi Plugins - Quick Setup for Windows
# Run: .\setup.ps1
# Bootstraps Bun if missing (the installer itself runs on Bun), then installs
# into $env:KIMI_CODE_HOME (default ~\.kimi-code).

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "🚀 Fusengine Kimi Plugins Setup (Windows)" -ForegroundColor Cyan

# Check Bun — offer the official installer when missing
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Bun not found — the Fusengine installer runs on Bun." -ForegroundColor Yellow
    $answer = Read-Host "Install Bun now via the official installer (bun.sh)? [Y/n]"
    if ($answer -eq "" -or $answer -match "^[Yy]") {
        powershell -c "irm bun.sh/install.ps1 | iex"
        # Make bun available for the rest of this script (new shells get it via profile)
        $env:Path = "$env:USERPROFILE\.bun\bin;$env:Path"
        if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
            Write-Host "❌ Bun install did not complete. Install from https://bun.sh then re-run .\setup.ps1" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Bun is required. Install from https://bun.sh then re-run .\setup.ps1" -ForegroundColor Red
        exit 1
    }
}

# No dependency install needed: this repo is zero-dependency.
Push-Location $ScriptDir
try {
    bun run scripts/install-kimi.ts --yes
} finally {
    Pop-Location
}
