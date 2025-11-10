# iOS Support Setup Guide

## Overview

The vibration/haptic feedback feature works differently on iOS compared to Android:

- **Android**: Full support via Vibration API in web browsers
- **iOS Web Browser**: Limited support - haptic feedback only works on direct user interactions (button presses), NOT when receiving vibration messages
- **iOS Native App**: Full support via Capacitor - haptic feedback works both on button presses AND when receiving messages

## Option 1: Web Browser (Limited iOS Support)

### Current Limitations

When using the app in iOS Safari/Chrome/Firefox:
- ✅ Haptic feedback works when **you press buttons** (automatic iOS Safari feature)
- ❌ Haptic feedback does **NOT work when receiving vibration messages** from your partner
- ✅ All other features work (WebSocket, UI, session management)

### Why?

iOS Safari does not support the Vibration API, and iOS restricts all browsers to use WebKit, which doesn't allow programmatic haptic feedback without user interaction.

## Option 2: Native iOS App (Full Support)

To get full haptic feedback support on iOS (including when receiving messages), you need to wrap the app with **Capacitor** and install it as a native iOS app.

### Prerequisites

- macOS (required for iOS development)
- Xcode (free from Mac App Store)
- Node.js and npm installed
- CocoaPods installed: `sudo gem install cocoapods`

### Setup Steps

1. **Install Capacitor dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Build the frontend:**
   ```bash
   npm run build
   ```

3. **Add iOS platform:**
   ```bash
   npx cap add ios
   ```

4. **Sync web assets to iOS:**
   ```bash
   npx cap sync ios
   ```

5. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```

6. **Configure the app in Xcode:**
   - Select your development team in Signing & Capabilities
   - Configure app name, bundle identifier, etc.
   - Build and run on simulator or device

7. **Test on iOS device:**
   - Connect your iPhone via USB
   - Select your device in Xcode
   - Click Run to install and test

### Building for App Store

1. **Update app version in Xcode**
2. **Archive the app:** Product → Archive
3. **Upload to App Store Connect**
4. **Submit for review**

## Option 3: Progressive Web App (PWA)

You can also install the web app as a PWA on iOS:

1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will open like a native app

**Note:** PWA still has the same limitations as web browser - haptic feedback only works on button presses, not when receiving messages.

## Comparison

| Feature | Android Web | iOS Web | iOS Native (Capacitor) |
|---------|-------------|---------|------------------------|
| Button Press Haptics | ✅ Yes | ✅ Yes | ✅ Yes |
| Receive Message Haptics | ✅ Yes | ❌ No | ✅ Yes |
| WebSocket | ✅ Yes | ✅ Yes | ✅ Yes |
| Session Management | ✅ Yes | ✅ Yes | ✅ Yes |
| Installation | Web Browser | Web Browser | App Store / TestFlight |

## Recommendation

- **For Android users**: Use the web browser - full support
- **For iOS users who want full haptic feedback**: Use the native iOS app (Capacitor)
- **For iOS users who only need basic features**: Web browser works fine (haptics on button press only)

## Troubleshooting

### Capacitor iOS Issues

1. **"Command not found: pod"**
   - Install CocoaPods: `sudo gem install cocoapods`

2. **Build errors in Xcode**
   - Clean build folder: Product → Clean Build Folder
   - Update CocoaPods: `cd ios/App && pod install`

3. **Haptics not working in native app**
   - Verify `@capacitor/haptics` is installed
   - Check that Haptics plugin is enabled in `capacitor.config.ts`
   - Rebuild the app after adding the plugin

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Haptics Plugin](https://capacitorjs.com/docs/apis/haptics)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)

