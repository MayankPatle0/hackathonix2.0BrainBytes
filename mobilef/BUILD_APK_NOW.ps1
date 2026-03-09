# ============================================
# COMPLETE AUTOMATED ANDROID SETUP & BUILD
# ============================================
# This script will guide you through the entire process

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Nexus APK - Complete Setup & Build" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$projectRoot = "d:\My_Revive\My_Revive\mobilef"
Set-Location $projectRoot

# Check if Android SDK exists
$sdkPath = "C:\Users\deshm\AppData\Local\Android\Sdk"
$sdkExists = Test-Path $sdkPath

if (-not $sdkExists) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ANDROID SDK NOT FOUND" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    
    Write-Host "The Android SDK is required to build APK files.`n" -ForegroundColor Yellow
    
    Write-Host "OPTION 1: Install Android Studio (RECOMMENDED)" -ForegroundColor Green
    Write-Host "1. Download from: https://developer.android.com/studio" -ForegroundColor Cyan
    Write-Host "2. Run the installer" -ForegroundColor Cyan
    Write-Host "3. Open Android Studio once (it will set up everything)" -ForegroundColor Cyan
    Write-Host "4. Come back and run this script again`n" -ForegroundColor Cyan
    
    Write-Host "OPTION 2: Download SDK Command-line Tools (ADVANCED)" -ForegroundColor Yellow
    Write-Host "1. Download from: https://developer.android.com/studio#command-tools" -ForegroundColor Cyan
    Write-Host "2. Extract to: C:\Android\cmdline-tools\latest" -ForegroundColor Cyan
    Write-Host "3. Set ANDROID_HOME=C:\Android" -ForegroundColor Cyan
    Write-Host "4. Run: sdkmanager `"platform-tools`" `"build-tools;34.0.0`" `"platforms;android-34`"`n" -ForegroundColor Cyan
    
    Write-Host "Press any key to open Android Studio download page..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    Start-Process "https://developer.android.com/studio"
    
    Write-Host "`nAfter installing Android Studio, run this script again!" -ForegroundColor Green
    exit 0
}

Write-Host "[OK] Android SDK found at: $sdkPath`n" -ForegroundColor Green

# Verify SDK components
Write-Host "Checking SDK components..." -ForegroundColor Yellow
$platformTools = Test-Path "$sdkPath\platform-tools"
$buildTools = Test-Path "$sdkPath\build-tools"
$platforms = Test-Path "$sdkPath\platforms"

if (-not $platformTools -or -not $buildTools -or -not $platforms) {
    Write-Host "[WARNING] Some SDK components are missing!" -ForegroundColor Yellow
    Write-Host "Open Android Studio > SDK Manager and install:" -ForegroundColor Yellow
    Write-Host "  - Android SDK Platform 34" -ForegroundColor Cyan
    Write-Host "  - Android SDK Build-Tools 34.0.0`n" -ForegroundColor Cyan
}

# Create local.properties
Write-Host "Creating android/local.properties..." -ForegroundColor Yellow
$localProps = "sdk.dir=$sdkPath"
$localProps | Out-File -FilePath "android\local.properties" -Encoding ASCII -Force
Write-Host "[OK] local.properties created`n" -ForegroundColor Green

# Install dependencies
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installing Dependencies" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependencies installed`n" -ForegroundColor Green

# Run expo prebuild
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Generating Android Project" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
npx expo prebuild --platform android --clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Expo prebuild failed!" -ForegroundColor Red
    Write-Host "This usually means SDK components are missing.`n" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Android project generated`n" -ForegroundColor Green

# Build APK
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building APK" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "This will take 10-15 minutes...`n" -ForegroundColor Yellow

Set-Location android
.\gradlew assembleDebug --no-daemon

if ($LASTEXITCODE -eq 0) {
    Set-Location ..
    $apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
    
    if (Test-Path $apkPath) {
        $apkSize = (Get-Item $apkPath).Length / 1MB
        
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green  
        Write-Host "========================================`n" -ForegroundColor Green
        
        Write-Host "APK Location: $apkPath" -ForegroundColor Cyan
        Write-Host "APK Size: $([math]::Round($apkSize, 2)) MB`n" -ForegroundColor Cyan
        
        # Copy to easy location
        $outputDir = "APK_OUTPUT"
        if (-not (Test-Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir | Out-Null
        }
        Copy-Item $apkPath "$outputDir\Nexus.apk" -Force
        
        Write-Host "Copied to: $outputDir\Nexus.apk`n" -ForegroundColor Green
        
        Write-Host "NEXT STEPS:" -ForegroundColor Cyan
        Write-Host "1. Transfer $outputDir\Nexus.apk to your Android phone" -ForegroundColor Yellow
        Write-Host "2. Enable 'Install from unknown sources' in Settings" -ForegroundColor Yellow
        Write-Host "3. Tap the APK file to install" -ForegroundColor Yellow
        Write-Host "4. Open and test the app!`n" -ForegroundColor Yellow
        
        # Open output directory
        explorer.exe $outputDir
    }
} else {
    Set-Location ..
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  BUILD FAILED" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "1. Make sure Android Studio is installed and opened at least once" -ForegroundColor Cyan
    Write-Host "2. Open Android Studio > SDK Manager > Install Android SDK Platform 34" -ForegroundColor Cyan
    Write-Host "3. Restart your computer and try again`n" -ForegroundColor Cyan
    
    exit 1
}
