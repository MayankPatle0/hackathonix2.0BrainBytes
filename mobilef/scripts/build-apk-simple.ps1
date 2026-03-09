# ============================================
# Nexus Quick Build Script (Local - Simplified)
# ============================================
# Builds APK locally using npx (no Android Studio needed if Android SDK exists)

Write-Host "Nexus Quick Build Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Move to project root
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# 1. Install dependencies
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies!`n" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed!`n" -ForegroundColor Green

# 2. Try to build using Expo
Write-Host "Step 2: Building APK..." -ForegroundColor Green
Write-Host "This will take 5-10 minutes...`n" -ForegroundColor Yellow

# Use npx to run expo prebuild and then run android
Write-Host "Running: npx expo run:android --variant release --no-bundler`n" -ForegroundColor Cyan

npx expo run:android --variant release --no-bundler

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n================================" -ForegroundColor Green
    Write-Host "Build Successful!" -ForegroundColor Green
    Write-Host "================================`n" -ForegroundColor Green
    
    $apkPath = "android\app\build\outputs\apk\release\app-release.apk"
    if (Test-Path $apkPath) {
        $apkSize = (Get-Item $apkPath).Length / 1MB
        Write-Host "APK built: $apkPath" -ForegroundColor Green
        Write-Host "Size: $([math]::Round($apkSize, 2)) MB`n" -ForegroundColor Cyan
        
        # Copy to output directory
        $outputDir = ".\APK_OUTPUT"
        if (-not (Test-Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir | Out-Null
        }
        Copy-Item $apkPath "$outputDir\Nexus-release.apk" -Force
        Write-Host "Copied to: $outputDir\Nexus-release.apk`n" -ForegroundColor Green
    }
} else {
    Write-Host "`n================================" -ForegroundColor Red
    Write-Host "Build Failed!" -ForegroundColor Red
    Write-Host "================================`n" -ForegroundColor Red
    Write-Host "If you don't have Android SDK installed, use the EAS build instead:" -ForegroundColor Yellow
    Write-Host ".\scripts\build-apk-eas.ps1`n" -ForegroundColor Cyan
    exit 1
}
