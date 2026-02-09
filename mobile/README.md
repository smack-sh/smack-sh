# Smack Mobile App

This directory contains the Flutter-based mobile application for Smack.

## Setup

1.  **Install Flutter:** Follow the official Flutter installation guide: [https://docs.flutter.dev/get-started/install](https://docs.flutter.dev/get-started/install)

2.  **Install Dependencies:** Navigate to this directory and run:
    ```bash
    flutter pub get
    ```

3.  **Run the Web App:** The mobile app is a WebView shell for the main Remix web application. You need to have the web app running for development.
    ```bash
    # In the root directory of the project
    npm run dev
    ```

## Development

To run the mobile app in development mode (connected to the local web app), use the following commands:

*   **iOS:**
    ```bash
    flutter run -d "iPhone" 
    ```
    (Replace "iPhone" with your simulator or connected device name)

*   **Android:**
    ```bash
    flutter run -d "Android"
    ```
    (Replace "Android" with your emulator or connected device name)

## Building for Production

To create a release build of the mobile app, use the following commands:

*   **iOS:**
    ```bash
    flutter build ipa
    ```

*   **Android:**
    ```bash
    flutter build apk
    ```
    or
    ```bash
    flutter build appbundle
    ```

## Code Signing and Deployment

### iOS

To build and deploy for iOS, you need to set up code signing:

1.  **Apple Developer Account:** Ensure you have an active Apple Developer Program membership.
2.  **Xcode Setup:**
    *   Open the `mobile/ios/Runner.xcworkspace` file in Xcode.
    *   Select the `Runner` project in the Project Navigator.
    *   Go to the `Signing & Capabilities` tab.
    *   Select your `Team` and ensure `Automatically manage signing` is checked. Xcode will attempt to create and manage the necessary provisioning profiles and signing certificates.
    *   If you need to manually manage signing, you'll need to create an App ID, a Development Certificate, a Distribution Certificate, and corresponding Provisioning Profiles (Development and App Store) via the Apple Developer website.
3.  **Fastlane Configuration:**
    *   The `mobile/fastlane/Fastfile` is set up for `app-store` distribution. You will need to configure Fastlane with your Apple Developer credentials.
    *   Run `fastlane init` in the `mobile/ios` directory (you might need to install Fastlane first: `gem install fastlane`).
    *   Follow the Fastlane prompts to set up your `Appfile` and `Fastfile` for your specific project and distribution needs. This typically involves setting up `match` for certificate and provisioning profile management.

### Android

To build and deploy for Android, you need to set up signing keys:

1.  **Generate an Upload Key:**
    ```bash
    keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
    ```
    *   Remember to keep your keystore file and its password, key alias, and key password secure.
2.  **Reference the Keystore in `android/app/build.gradle`:**
    *   Create a file named `key.properties` in the `android` directory (next to `build.gradle`).
    *   Add the following to `key.properties`, replacing the placeholders with your actual information:
        ```properties
        storePassword=YOUR_STORE_PASSWORD
        keyPassword=YOUR_KEY_PASSWORD
        keyAlias=upload
        storeFile=/Users/YOUR_USERNAME/upload-keystore.jks
        ```
    *   **DO NOT commit `key.properties` to version control.** Add it to your `.gitignore`.
    *   Modify `android/app/build.gradle` to read these properties and configure signing:
        ```gradle
        android {
            ...
            defaultConfig {
                ...
            }
            signingConfigs {
                release {
                    storeFile file(System.getenv("UPLOAD_KEYSTORE_FILE") ?: "key.properties")
                    storePassword System.getenv("UPLOAD_STORE_PASSWORD") ?: "key.properties"
                    keyAlias System.getenv("UPLOAD_KEY_ALIAS") ?: "key.properties"
                    keyPassword System.getenv("UPLOAD_KEY_PASSWORD") ?: "key.properties"
                }
            }
            buildTypes {
                release {
                    signingConfig signingConfigs.release
                    ...
                }
            }
        }
        ```
        *Note: The above `build.gradle` snippet is a general guide. You might need to adapt it based on your existing `build.gradle` structure.*
3.  **Fastlane Configuration:**
    *   The `mobile/fastlane/Fastfile` has a basic Android build lane. You will need to configure Fastlane for Android deployment, typically using `supply` for Google Play Store uploads.
    *   Run `fastlane init` in the `mobile/android` directory (you might need to install Fastlane first: `gem install fastlane`).
    *   Follow the Fastlane prompts to set up your `Appfile` and `Fastfile` for your specific project and distribution needs.

This concludes Part 1: Flutter Mobile App. I will now update the todo list.