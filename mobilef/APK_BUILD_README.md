# 🚀 Nexus AI Mobile App - APK Build Guide

Quick guide to build your Android APK in 3 simple steps!

## Quick Start

```powershell
cd d:\My_Revive\My_Revive\mobilef
.\scripts\setup-android.ps1
.\scripts\build-apk.ps1
```

Your APK will be in: `APK_OUTPUT\Nexus-release.apk`

## What You Need

- Windows PC
- Java JDK 17 ([Download](https://adoptium.net/temurin/releases/?version=17))
- Node.js ([Download](https://nodejs.org/))  
- Android SDK - Install [Android Studio](https://developer.android.com/studio) (easiest way)

## Step-by-Step

### 1. Install Prerequisites

**Java JDK 17:**
- Download and install from link above
- Set `JAVA_HOME` environment variable to JDK path
- Verify: `java -version`

**Android Studio:**
- Download and install
- Open SDK Manager and note the SDK location
- Set `ANDROID_HOME` environment variable to SDK path
- Add `%ANDROID_HOME%\platform-tools` to PATH

### 2. Run Setup Script

```powershell
cd d:\My_Revive\My_Revive\mobilef
.\scripts\setup-android.ps1
```

This checks your environment and installs dependencies.

### 3. Build APK

```powershell
.\scripts\build-apk.ps1
```

Wait 5-10 minutes for the build to complete.

**Output:**
- Debug APK: `APK_OUTPUT\Nexus-debug.apk` (for testing)
- Release APK: `APK_OUTPUT\Nexus-release.apk` (for distribution)

### 4. Install on Phone

1. Transfer APK to your Android phone (USB, email, or cloud)
2. Enable "Install from unknown sources" in phone settings
3. Tap the APK file to install
4. Open the app and create an account

## Files Changed

- ✅ `app.json` - Added REDIRECT_URL configuration
- ✅ `utils/constants.js` - Added validation and fallbacks
- ✅ `utils/backend.js` - Added retry logic and timeout handling
- ✅ `android/app/build.gradle` - Added release signing configuration
- ✅ `scripts/setup-android.ps1` - Environment setup checker
- ✅ `scripts/build-apk.ps1` - Automated build script
- ✅ `scripts/test-backend.ps1` - Backend health checker

## Testing

After installing the APK on your phone:

1. **Sign Up** - Create account with email/password
2. **Confirm Email** - Check email for confirmation link
3. **Sign In** - Login with your credentials
4. **Add Memory** - Share text/URL from another app
5. **Search** - Test search functionality
6. **Logout/Login** - Verify session persistence

## Backend Status

Backend URL: `https://complete-nexus.onrender.com`

Test it:
```powershell
.\scripts\test-backend.ps1
```

Or manually:
```powershell
Invoke-RestMethod -Uri "https://complete-nexus.onrender.com/health"
```

## Troubleshooting

**Build fails:**
- Run `.\scripts\setup-android.ps1` to check environment
- Make sure JAVA_HOME and ANDROID_HOME are set
- Restart PowerShell after setting environment variables

**App crashes:**
- Check backend is running (test-backend.ps1)
- Verify app.json has correct Supabase credentials
- Check Android logcat for error messages

**Can't install APK:**
- Enable "Install from unknown sources"
- Make sure you have storage space
- Uninstall old version first

## Next Steps

1. Test the app thoroughly
2. Share APK with beta testers
3. Collect feedback
4. Consider publishing to Play Store

## Complete Documentation

For detailed instructions, see: `walkthrough.md`

---

**Everything is ready to build! Run the scripts and you'll have your APK in minutes. 🎉**
