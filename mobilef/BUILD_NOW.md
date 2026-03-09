# 🚀 Quick Build Guide - Choose Your Method

You have **2 options** to build your APK:

## Option 1: EAS Build (Cloud - RECOMMENDED)
✅ **No Android SDK needed**  
✅ Easy and reliable  
✅ First build is free

```powershell
.\scripts\build-apk-eas.ps1
```

**What happens:**
1. Installs EAS CLI (one-time)
2. Asks you to login to Expo account (free signup at expo.dev)
3. Builds APK in the cloud (15-20 mins)
4. Downloads APK when done

## Option 2: Local Build (Requires Android SDK)
❌ Needs Android SDK installed  
❌ More complex setup  
✅ Faster repeated builds

```powershell
.\scripts\build-apk-simple.ps1
```

**What happens:**
1. Installs dependencies
2. Builds APK locally (5-10 mins)
3. Outputs to `APK_OUTPUT\Nexus-release.apk`

---

## Current Setup Status

✅ Java JDK 17: Installed  
✅ Node.js v22: Installed  
✅ JAVA_HOME: Set correctly  
❌ ANDROID_HOME: Not set (only needed for local build)

---

## Recommendation

**Use Option 1 (EAS Build)** - It's simpler and doesn't require Android SDK setup.

Just run:
```powershell
.\scripts\build-apk-eas.ps1
```

Then follow the prompts to:
1. Create/login to Expo account (free)
2. Wait for cloud build
3. Download your APK

---

## If You Want Local Build

You'll need to install Android SDK first.

**Quickest way:**
1. Install [Android Studio](https://developer.android.com/studio)
2. Open it and let it install Android SDK
3. Note the SDK location (usually `C:\Users\YourName\AppData\Local\Android\Sdk`)
4. Set environment variable:
   ```powershell
   [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\YourName\AppData\Local\Android\Sdk", "Machine")
   ```
5. Restart PowerShell
6. Run `.\scripts\build-apk-simple.ps1`

---

## Next Steps After Build

1. Transfer APK to Android phone
2. Enable "Install from unknown sources"
3. Install and test!

See `walkthrough.md` for complete testing guide.
