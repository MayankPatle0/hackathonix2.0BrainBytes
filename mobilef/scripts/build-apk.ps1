# ============================================
# Nexus APK Build Script
# ============================================
# Builds both Debug and Release APK files

param(
    [switch]$DebugOnly,
    [switch]$ReleaseOnly,
    [switch]$SkipClean
)

Write-Host "🏗️  Nexus APK Build Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Move to project root
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Verify we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "   Make sure you're running this script from the mobilef directory.`n" -ForegroundColor Yellow
    exit 1
}

# 1. Clean previous builds (unless -SkipClean is specified)
if (-not $SkipClean) {
    Write-Host "🧹 Step 1: Cleaning previous builds..." -ForegroundColor Green
    Set-Location android
    if (Test-Path "app\build") {
        Write-Host "   Removing app\build directory..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "app\build" -ErrorAction SilentlyContinue
    }
    .\gradlew clean
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Gradle clean failed, but continuing...`n" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Clean completed!`n" -ForegroundColor Green
    }
    Set-Location ..
} else {
    Write-Host "⏭️  Skipping clean step`n" -ForegroundColor Yellow
}

# 2. Install dependencies
Write-Host "📦 Step 2: Installing dependencies..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!`n" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed!`n" -ForegroundColor Green

# 3. Build Debug APK (unless -ReleaseOnly is specified)
if (-not $ReleaseOnly) {
    Write-Host "🔨 Step 3: Building DEBUG APK..." -ForegroundColor Green
    Write-Host "   This may take 5-10 minutes on first build...`n" -ForegroundColor Yellow
    
    Set-Location android
    .\gradlew assembleDebug --stacktrace
    $debugSuccess = $LASTEXITCODE -eq 0
    Set-Location ..
    
    if ($debugSuccess) {
        $debugApk = "android\app\build\outputs\apk\debug\app-debug.apk"
        if (Test-Path $debugApk) {
            $apkSize = (Get-Item $debugApk).Length / 1MB
            Write-Host "✅ DEBUG APK built successfully! ($([math]::Round($apkSize, 2)) MB)" -ForegroundColor Green
            Write-Host "   Location: $debugApk`n" -ForegroundColor Cyan
            
            # Copy to easy-to-find location
            $outputDir = ".\APK_OUTPUT"
            if (-not (Test-Path $outputDir)) {
                New-Item -ItemType Directory -Path $outputDir | Out-Null
            }
            Copy-Item $debugApk "$outputDir\Nexus-debug.apk" -Force
            Write-Host "📁 Copied to: $outputDir\Nexus-debug.apk`n" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ DEBUG build failed! Check the error above.`n" -ForegroundColor Red
        if (-not $ReleaseOnly -and -not $DebugOnly) {
            Write-Host "   Skipping release build due to debug failure.`n" -ForegroundColor Yellow
            exit 1
        }
    }
}

# 4. Create Release Keystore (if it doesn't exist)
if (-not $DebugOnly) {
    $keystorePath = "android\app\release.keystore"
    if (-not (Test-Path $keystorePath)) {
        Write-Host "🔐 Step 4: Creating release keystore..." -ForegroundColor Green
        
        $storePassword = "nexus2025"
        $keyPassword = "nexus2025"
        $alias = "nexus-release"
        
        # Check if keytool is available
        try {
            keytool -version *> $null
        } catch {
            Write-Host "❌ keytool not found! Make sure JAVA_HOME is set correctly.`n" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "   Generating keystore with alias: $alias" -ForegroundColor Yellow
        Write-Host "   Password: $storePassword (You can change this later)`n" -ForegroundColor Yellow
        
        keytool -genkeypair -v `
            -storetype PKCS12 `
            -keystore $keystorePath `
            -alias $alias `
            -keyalg RSA `
            -keysize 2048 `
            -validity 10000 `
            -storepass $storePassword `
            -keypass $keyPassword `
            -dname "CN=Nexus AI, OU=Development, O=Nexus, L=Unknown, S=Unknown, C=US"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Keystore created successfully!`n" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create keystore!`n" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ Release keystore already exists: $keystorePath`n" -ForegroundColor Green
    }
    
    # 5. Build Release APK
    Write-Host "🔨 Step 5: Building RELEASE APK..." -ForegroundColor Green
    Write-Host "   This may take 5-10 minutes...`n" -ForegroundColor Yellow
    
    Set-Location android
    .\gradlew assembleRelease --stacktrace
    $releaseSuccess = $LASTEXITCODE -eq 0
    Set-Location ..
    
    if ($releaseSuccess) {
        $releaseApk = "android\app\build\outputs\apk\release\app-release.apk"
        if (Test-Path $releaseApk) {
            $apkSize = (Get-Item $releaseApk).Length / 1MB
            Write-Host "✅ RELEASE APK built successfully! ($([math]::Round($apkSize, 2)) MB)" -ForegroundColor Green
            Write-Host "   Location: $releaseApk`n" -ForegroundColor Cyan
            
            # Copy to easy-to-find location
            $outputDir = ".\APK_OUTPUT"
            if (-not (Test-Path $outputDir)) {
                New-Item -ItemType Directory -Path $outputDir | Out-Null
            }
            Copy-Item $releaseApk "$outputDir\Nexus-release.apk" -Force
            Write-Host "📁 Copied to: $outputDir\Nexus-release.apk`n" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ RELEASE build failed! Check the error above.`n" -ForegroundColor Red
        exit 1
    }
}

# 6. Summary
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📊 Build Summary" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$outputDir = ".\APK_OUTPUT"
if (Test-Path "$outputDir\Nexus-debug.apk") {
    $size = (Get-Item "$outputDir\Nexus-debug.apk").Length / 1MB
    Write-Host "✅ Debug APK: $outputDir\Nexus-debug.apk ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
}
if (Test-Path "$outputDir\Nexus-release.apk") {
    $size = (Get-Item "$outputDir\Nexus-release.apk").Length / 1MB
    Write-Host "✅ Release APK: $outputDir\Nexus-release.apk ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
}

Write-Host "`n📱 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Transfer the APK file to your Android device (via USB, email, or cloud)" -ForegroundColor Yellow
Write-Host "2. On your device, enable 'Install from unknown sources' in Settings" -ForegroundColor Yellow
Write-Host "3. Open the APK file on your device to install" -ForegroundColor Yellow
Write-Host "4. Test the app thoroughly!`n" -ForegroundColor Yellow

Write-Host "💡 Tip: Use the Debug APK for testing. Use Release APK for distribution.`n" -ForegroundColor Cyan
