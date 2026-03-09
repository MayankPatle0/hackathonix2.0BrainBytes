# ============================================
# Nexus APK Build Script (Using EAS Build)
# ============================================
# Simplified build using Expo's cloud build service

Write-Host "Nexus APK Build Script (EAS Cloud Build)" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Move to project root
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Verify we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this script from the mobilef directory.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "This script uses Expo's EAS Build service (cloud-based build)" -ForegroundColor Yellow
Write-Host "Benefits: No Android SDK installation required!" -ForegroundColor Green
Write-Host "Note: First build is free, then requires Expo subscription`n" -ForegroundColor Yellow

# Check if EAS CLI is installed
Write-Host "Checking EAS CLI..." -ForegroundColor Green
try {
    $easVersion = eas --version 2>&1
    Write-Host "EAS CLI is installed: $easVersion`n" -ForegroundColor Green
} catch {
    Write-Host "EAS CLI not found. Installing...`n" -ForegroundColor Yellow
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install EAS CLI!" -ForegroundColor Red
        exit 1
    }
}

# Login to Expo
Write-Host "================================" -ForegroundColor Cyan
Write-Host "STEP 1: Login to Expo Account" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan
Write-Host "If you don't have an Expo account, create one at: https://expo.dev/signup`n" -ForegroundColor Yellow

eas login

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nFailed to login. Please try again.`n" -ForegroundColor Red
    exit 1
}

# Configure EAS Build
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "STEP 2: Configure Build" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

eas build:configure

# Build APK
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "STEP 3: Build APK" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan
Write-Host "Building for Android platform..." -ForegroundColor Yellow
Write-Host "This will take 15-20 minutes (cloud build)`n" -ForegroundColor Yellow

eas build --platform android --profile preview

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n================================" -ForegroundColor Green
    Write-Host "Build Complete!" -ForegroundColor Green
    Write-Host "================================`n" -ForegroundColor Green
    Write-Host "Your APK has been built in the cloud!" -ForegroundColor Green
    Write-Host "Download it from the URL shown above or from: https://expo.dev`n" -ForegroundColor Cyan
} else {
    Write-Host "`nBuild failed. Check the error above.`n" -ForegroundColor Red
    exit 1
}
