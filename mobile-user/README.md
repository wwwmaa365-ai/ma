# SANJIT MUSICAL STORE — Customer Android App (React Native + Expo SDK 52)

Official customer shopping Android application (`com.sanjitmusical.store`) for **SANJIT MUSICAL STORE** featuring Musical Instruments, Pro Audio / Electronic Equipment, Classical & Folk Dance Dresses, and Dance Accessories.

## Features
- **Home & Storefront**: Search bar, 4 master categories, New Arrivals rail, and Best Sellers grid.
- **Full Catalog & Product Details**: Category filtering, price/rating sorting, variant selection, specifications, warranty strip, and verified reviews with seller responses.
- **Shopping Cart & UPI QR Checkout**: Promo coupons (`SANJIT10`, `BIHU15`, `CONCERT500`), GST & insured shipping breakdown, scannable UPI QR instant pay (`sanjitmusical@sbi`), card, and Cash on Delivery.
- **Orders & Doorstep OTP Tracking**: Fulfillment timeline, courier AWB info, 4-digit Delivery OTP display, order cancellation, and verified review submission synced to Firestore.
- **Account, Wishlist & Store Chat**: Editable shipping address, saved wishlist, and live store support chat.

## Run Locally with Expo
```bash
npm install --legacy-peer-deps
npx expo start
```

## Generate Installable Android APK

### Option 1: GitHub Actions (No EAS account needed)
Push this folder to a GitHub repository and run **Actions → Build SANJIT MUSICAL STORE User App APK** (`.github/workflows/build-android-apk.yml`). Download `sanjit-musical-store-user-app-apk` from the workflow artifacts.

### Option 2: Expo EAS Cloud Build
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
Or add an `EXPO_TOKEN` GitHub repository secret to trigger `.github/workflows/eas-build.yml` automatically on push.
