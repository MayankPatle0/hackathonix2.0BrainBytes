# ============================================
# Nexus Android Setup Script
# ============================================
# This script sets up your Windows machine for Android development
# Run this ONCE before building the APK

Write-Host "Nexus Android Setup Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Warning: Not running as Administrator. Some installations may fail." -ForegroundColor Yellow
    Write-Host "Consider right-clicking PowerShell and selecting 'Run as Administrator'`n" -ForegroundColor Yellow
}

# 1. Check Java JDK
Write-Host "Step 1: Checking Java JDK..." -ForegroundColor Green
try {
    $javaVersion = java -version 2>&1 | Select-String "version" | ForEach-Object { $_.ToString() }
    if ($javaVersion -match '"17') {
        Write-Host "Java JDK 17 is already installed: $javaVersion`n" -ForegroundColor Green
    } else {
        Write-Host "Java version found but not JDK 17: $javaVersion" -ForegroundColor Yellow
        Write-Host "Recommended: Install Java JDK 17 from:" -ForegroundColor Yellow
        Write-Host "https://adoptium.net/temurin/releases/?version=17`n" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Java JDK not found!" -ForegroundColor Red
    Write-Host "Please install Java JDK 17 from:" -ForegroundColor Yellow
    Write-Host "https://adoptium.net/temurin/releases/?version=17" -ForegroundColor Cyan
    Write-Host "After installation, restart PowerShell and run this script again.`n" -ForegroundColor Yellow
}

# 2. Check Node.js
Write-Host "Step 2: Checking Node.js..." -ForegroundColor Green
try {
    $nodeVersion = node --version
    Write-Host "Node.js is installed: $nodeVersion`n" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/`n" -ForegroundColor Yellow
    exit 1
}

# 3. Check Android SDK (ANDROID_HOME)
Write-Host "Step 3: Checking Android SDK..." -ForegroundColor Green
$androidHome = $env:ANDROID_HOME
if ($androidHome -and (Test-Path $androidHome)) {
    Write-Host "ANDROID_HOME is set: $androidHome`n" -ForegroundColor Green
} else {
    Write-Host "ANDROID_HOME not set or directory doesn't exist" -ForegroundColor Yellow
    Write-Host "Option 1 (RECOMMENDED): Install Android Studio" -ForegroundColor Yellow
    Write-Host "Download from: https://developer.android.com/studio" -ForegroundColor Cyan
    Write-Host "After installation, open Android Studio, go to SDK Manager" -ForegroundColor Yellow
    Write-Host "Copy the SDK location and set ANDROID_HOME environment variable.`n" -ForegroundColor Yellow
    
    Write-Host "Option 2: Use command-line tools only (Advanced)" -ForegroundColor Yellow
    Write-Host "Download from: https://developer.android.com/studio#command-tools" -ForegroundColor Cyan
    Write-Host "Extract to C:\Android\cmdline-tools and set ANDROID_HOME=C:\Android`n" -ForegroundColor Yellow
}

# 4. Check JAVA_HOME
Write-Host "Step 4: Checking JAVA_HOME..." -ForegroundColor Green
$javaHome = $env:JAVA_HOME
if ($javaHome -and (Test-Path $javaHome)) {
    Write-Host "JAVA_HOME is set: $javaHome`n" -ForegroundColor Green
} else {
    Write-Host "JAVA_HOME not set!" -ForegroundColor Yellow
    Write-Host "Find your Java installation directory (usually C:\Program Files\Eclipse Adoptium\jdk-17...)" -ForegroundColor Yellow
    Write-Host "Then run this command in PowerShell (as Administrator):" -ForegroundColor Yellow
    Write-Host '[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.X.X.X-hotspot", "Machine")' -ForegroundColor Cyan
    Write-Host "Replace X.X.X.X with your actual version number`n" -ForegroundColor Yellow
}

# 5. Install dependencies
Write-Host "Step 5: Installing project dependencies..." -ForegroundColor Green
Set-Location -Path (Join-Path $PSScriptRoot "..")
if (Test-Path "package.json") {
    Write-Host "Installing npm packages..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependencies installed successfully!`n" -ForegroundColor Green
    } else {
        Write-Host "Failed to install dependencies. Check the error above.`n" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "package.json not found! Are you in the correct directory?`n" -ForegroundColor Red
    exit 1
}

# 6. Summary
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Setup Summary" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$allGood = $true

if (Get-Command java -ErrorAction SilentlyContinue) {
    Write-Host "[OK] Java JDK: Installed" -ForegroundColor Green
} else {
    Write-Host "[MISSING] Java JDK: Not installed" -ForegroundColor Red
    $allGood = $false
}

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "[OK] Node.js: Installed" -ForegroundColor Green
} else {
    Write-Host "[MISSING] Node.js: Not installed" -ForegroundColor Red
    $allGood = $false
}

if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
    Write-Host "[OK] Android SDK: Configured" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Android SDK: Not configured" -ForegroundColor Yellow
    $allGood = $false
}

if ($env:JAVA_HOME -and (Test-Path $env:JAVA_HOME)) {
    Write-Host "[OK] JAVA_HOME: Set" -ForegroundColor Green
} else {
    Write-Host "[WARNING] JAVA_HOME: Not set" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""

if ($allGood) {
    Write-Host "Your system is ready to build Android APKs!" -ForegroundColor Green
    Write-Host "Next step: Run .\scripts\build-apk.ps1 to generate the APK`n" -ForegroundColor Cyan
} else {
    Write-Host "Please complete the setup steps above before building." -ForegroundColor Yellow
    Write-Host "After making changes, restart PowerShell and run this script again.`n" -ForegroundColor Yellow
}
