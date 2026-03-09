# ============================================
# Expo Prebuild and Local APK Build
# ============================================
# This method uses expo prebuild to generate Android project locally

Write-Host "Expo Prebuild + Local Build Method" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "This method generates the Android project locally and builds APK" -ForegroundColor Yellow
Write-Host "Note: This bypasses EAS Build cloud service`n" -ForegroundColor Yellow

# 1. Clean previous builds
Write-Host "Step 1: Cleaning android directory..." -ForegroundColor Green
if (Test-Path "android") {
    Write-Host "Removing existing android directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "android" -ErrorAction SilentlyContinue
}
Write-Host "Clean completed!`n" -ForegroundColor Green

# 2. Install dependencies
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Green
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies!`n" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed!`n" -ForegroundColor Green

# 3. Run expo prebuild
Write-Host "Step 3: Running expo prebuild..." -ForegroundColor Green
Write-Host "This generates the native Android project...`n" -ForegroundColor Yellow
npx expo prebuild --platform android --clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "Prebuild failed!`n" -ForegroundColor Red
    exit 1
}
Write-Host "Prebuild completed!`n" -ForegroundColor Green

# 4. Build APK using Gradle
Write-Host "Step 4: Building Debug APK with Gradle..." -ForegroundColor Green
Write-Host "This may take 5-10 minutes...`n" -ForegroundColor Yellow

Set-Location android
.\gradlew assembleDebug --stacktrace
$buildSuccess = $LASTEXITCODE -eq 0
Set-Location ..

if ($buildSuccess) {
    $apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        $apkSize = (Get-Item $apkPath).Length / 1MB
        Write-Host "`n================================" -ForegroundColor Green
        Write-Host "Build Successful!" -ForegroundColor Green
        Write-Host "================================`n" -ForegroundColor Green
        Write-Host "Debug APK: $apkPath" -ForegroundColor Green
        Write-Host "Size: $([math]::Round($apkSize, 2)) MB`n" -ForegroundColor Cyan
        
        # Copy to output directory
        $outputDir = ".\APK_OUTPUT"
        if (-not (Test-Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir | Out-Null
        }
        Copy-Item $apkPath "$outputDir\Nexus-debug.apk" -Force
        Write-Host "Copied to: $outputDir\Nexus-debug.apk`n" -ForegroundColor Green
        
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Transfer APK to your Android device" -ForegroundColor Yellow
        Write-Host "2. Enable 'Install from unknown sources'" -ForegroundColor Yellow
        Write-Host "3. Install and test!`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n================================" -ForegroundColor Red
    Write-Host "Build Failed!" -ForegroundColor Red
    Write-Host "================================`n" -ForegroundColor Red
    Write-Host "Check the error messages above for details.`n" -ForegroundColor Yellow
    exit 1
}
