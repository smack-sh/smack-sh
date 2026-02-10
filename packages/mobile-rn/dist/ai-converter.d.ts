/**
 * React Native AI Converter - Converts web React components to React Native
 */
export declare class ReactNativeAIConverter {
    private componentMap;
    private eventMap;
    private styleMap;
    constructor();
    /**
     * Convert web React component to React Native
     * @param webComponent Web React component as string
     * @returns React Native component as string
     */
    convertWebToNative(webComponent: string): string;
    /**
     * Convert className to React Native StyleSheet
     */
    private convertClassNameToStyles;
    /**
     * Generate native bridge for iOS (Swift)
     */
    generateIOSNativeBridge(moduleName: string, methods: string[]): string;
    /**
     * Generate native bridge for Android (Kotlin)
     */
    generateAndroidNativeBridge(moduleName: string, methods: string[]): string;
    /**
     * Generate TypeScript interface for native bridge
     */
    generateTypeScriptInterface(moduleName: string, methods: string[]): string;
    /**
     * Generate Expo configuration
     */
    generateExpoConfig(appName: string, bundleIdentifier: string): string;
    /**
     * Generate React Navigation setup
     */
    generateReactNavigationSetup(screens: string[]): string;
    /**
     * Generate platform-specific code files
     */
    generatePlatformSpecificFiles(componentName: string): {
        ios: string;
        android: string;
    };
    /**
     * Generate device permissions setup
     */
    generatePermissionsSetup(permissions: string[]): string;
    /**
     * Generate push notifications configuration
     */
    generatePushNotificationsConfig(): string;
    /**
     * Generate app store deployment configuration
     */
    generateAppStoreConfig(appName: string, bundleId: string): string;
}
