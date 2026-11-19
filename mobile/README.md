# SANJIT SHOP PARTNER — React Native + Expo Android App

Complete React Native + Expo TypeScript Android Seller Application for **SANJIT MUSICAL STORE**.

- **App Name**: Sanjit Shop Partner
- **Android Package**: `in.sanjitmusical.shoppartner`
- **Version**: `1.0.0`
- **Orientation**: Portrait (`320px` – `430px+` responsive Flexbox)
- **Theme**: Royal Purple (`#4C1D95`), Crisp White (`#FFFFFF`), Imperial Gold (`#F59E0B`)

## Quick Start (Run on Android with Expo Go)

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on your Android phone, or press `a` to launch on an Android emulator.

## Option A: Build Installable Android APK via GitHub Actions (No Local Android SDK Required)

Push this project to any GitHub repository and open the **Actions** tab:

1. **Direct GitHub Runner APK Build (`.github/workflows/build-android-apk.yml`)** — **No secrets or Expo token required**:
   - Click **Build SANJIT SHOP PARTNER Android APK → Run workflow**.
   - GitHub Actions runs `expo prebuild --platform android` and compiles the APK via Gradle.
   - Download `sanjit-shop-partner-android-apk` from the workflow **Artifacts** section and install `SanjitShopPartner-v1.0.0-release.apk` directly on any Android phone.
2. **Expo EAS Cloud Build (`.github/workflows/eas-android-apk.yml`)**:
   - Add your Expo access token as a GitHub repository secret named `EXPO_TOKEN` (**Settings → Secrets and variables → Actions**).
   - Click **Expo EAS Build Android APK → Run workflow** (`preview` for `.apk`, `production` for `.aab`).

## Option B: Build Installable Android APK Locally via Expo EAS CLI

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

When EAS finishes building in the cloud, open the returned download URL or scan the QR code on your Android device to install the signed `.apk`.

## Project Structure

- `App.tsx` — Root React Navigation container (Auth Stack + 5 Bottom Tabs: Home, Orders, Products, Earnings, Profile + all 22 screens)
- `app.json` — Expo Android configuration (`in.sanjitmusical.shoppartner`, icon, adaptive icon, splash screen, permissions)
- `eas.json` — EAS Build profiles (`preview` -> APK, `production` -> AAB)
- `src/theme/theme.ts` — Purple, white & gold palette + responsive mobile scaler
- `src/types/index.ts` — Full TypeScript domain interfaces
- `src/data/demoData.ts` — Clearly labelled Demo Mode data including all 15 sample musical & dance products
- `src/context/PartnerStoreContext.tsx` — Reactive state store for all 22 screens
- `src/screens/` — All 22 screens across Auth, Dashboard/Products/Inventory, Orders/Tracking/Customers/Delivery, Sales/Earnings/Commission/Subscriptions/Withdrawals, and Chat/Profile/Settings
- `assets/` — Android app icon (`1024x1024`), adaptive icon (`1024x1024`), splash screen (`1284x2778`), and bundled product images
