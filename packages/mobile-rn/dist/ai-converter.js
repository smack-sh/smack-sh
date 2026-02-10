/**
 * React Native AI Converter - Converts web React components to React Native
 */
export class ReactNativeAIConverter {
    constructor() {
        // Component mapping: web -> native
        this.componentMap = new Map([
            ['div', 'View'],
            ['span', 'Text'],
            ['p', 'Text'],
            ['button', 'TouchableOpacity'],
            ['a', 'TouchableOpacity'],
            ['img', 'Image'],
            ['input', 'TextInput'],
            ['section', 'View'],
            ['header', 'View'],
            ['footer', 'View'],
            ['nav', 'View'],
            ['ul', 'FlatList'],
            ['li', 'Text']
        ]);
        // Event mapping: web -> native
        this.eventMap = new Map([
            ['onClick', 'onPress'],
            ['onChange', 'onChangeText'],
            ['className', 'style'],
            ['href', 'onPress'],
            ['src', 'source']
        ]);
        // Style property mapping
        this.styleMap = new Map([
            ['margin', 'margin'],
            ['padding', 'padding'],
            ['color', 'color'],
            ['backgroundColor', 'backgroundColor'],
            ['fontSize', 'fontSize'],
            ['fontWeight', 'fontWeight'],
            ['width', 'width'],
            ['height', 'height'],
            ['flex', 'flex'],
            ['flexDirection', 'flexDirection'],
            ['justifyContent', 'justifyContent'],
            ['alignItems', 'alignItems']
        ]);
    }
    /**
     * Convert web React component to React Native
     * @param webComponent Web React component as string
     * @returns React Native component as string
     */
    convertWebToNative(webComponent) {
        // Parse the component (simplified parsing for demo)
        let nativeComponent = webComponent;
        // Replace component names
        this.componentMap.forEach((nativeTag, webTag) => {
            const regex = new RegExp(`<${webTag}(\\s|>)`, 'g');
            nativeComponent = nativeComponent.replace(regex, `<${nativeTag}$1`);
            const closingRegex = new RegExp(`</${webTag}>`, 'g');
            nativeComponent = nativeComponent.replace(closingRegex, `</${nativeTag}>`);
        });
        // Replace events and props
        this.eventMap.forEach((nativeProp, webProp) => {
            const regex = new RegExp(`${webProp}=`, 'g');
            nativeComponent = nativeComponent.replace(regex, `${nativeProp}=`);
        });
        // Convert className to StyleSheet
        nativeComponent = this.convertClassNameToStyles(nativeComponent);
        return nativeComponent;
    }
    /**
     * Convert className to React Native StyleSheet
     */
    convertClassNameToStyles(component) {
        // Extract className values
        const classNameRegex = /className="([^"]+)"/g;
        const matches = [...component.matchAll(classNameRegex)];
        if (matches.length === 0)
            return component;
        let result = component;
        const styles = {};
        let styleIndex = 0;
        matches.forEach((match, index) => {
            const classNames = match[1].split(' ');
            const styleName = `style${index}`;
            // Generate style object
            const styleObject = {};
            classNames.forEach(className => {
                // Simple mapping for demo - in real implementation, parse CSS
                if (className.includes('flex')) {
                    styleObject.flexDirection = className.includes('row') ? 'row' : 'column';
                }
                if (className.includes('justify-')) {
                    styleObject.justifyContent = className.includes('center') ? 'center' :
                        className.includes('start') ? 'flex-start' :
                            className.includes('end') ? 'flex-end' : 'flex-start';
                }
                if (className.includes('items-')) {
                    styleObject.alignItems = className.includes('center') ? 'center' :
                        className.includes('start') ? 'flex-start' :
                            className.includes('end') ? 'flex-end' : 'flex-start';
                }
                if (className.includes('p-')) {
                    const padding = parseInt(className.replace('p-', '')) * 4;
                    styleObject.padding = padding;
                }
                if (className.includes('m-')) {
                    const margin = parseInt(className.replace('m-', '')) * 4;
                    styleObject.margin = margin;
                }
            });
            styles[styleName] = styleObject;
            // Replace className with style prop
            result = result.replace(match[0], `style={styles.${styleName}}`);
        });
        // Add StyleSheet.create at the top
        const styleSheetCode = `
const styles = StyleSheet.create(${JSON.stringify(styles, null, 2)});`;
        result = styleSheetCode + '\n' + result;
        return result;
    }
    /**
     * Generate native bridge for iOS (Swift)
     */
    generateIOSNativeBridge(moduleName, methods) {
        return `// ${moduleName}Bridge.swift
import Foundation
import React

@objc(${moduleName}Bridge)
class ${moduleName}Bridge: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  ${methods.map(method => {
            const methodName = method.split('(')[0];
            return `  @objc(${methodName})
  func ${methodName}(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Implementation here
    resolve(["success": true])
  }`;
        }).join('\n\n  ')}

  @objc func constantsToExport() -> [String: Any]! {
    return [
      "moduleName": "${moduleName}"
    ]
  }
}`;
    }
    /**
     * Generate native bridge for Android (Kotlin)
     */
    generateAndroidNativeBridge(moduleName, methods) {
        return `// ${moduleName}Bridge.kt
package com.smack.${moduleName.toLowerCase()}

import com.facebook.react.bridge.*

class ${moduleName}Bridge(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "${moduleName}Bridge"
  }

  ${methods.map(method => {
            const methodName = method.split('(')[0];
            return `  @ReactMethod
  fun ${methodName}(promise: Promise) {
    try {
      // Implementation here
      promise.resolve(Arguments.createMap().apply {
        putBoolean("success", true)
      })
    } catch (e: Exception) {
      promise.reject("ERROR", e.message)
    }
  }`;
        }).join('\n\n  ')}

  companion object {
    fun createModule(reactContext: ReactApplicationContext): ${moduleName}Bridge {
      return ${moduleName}Bridge(reactContext)
    }
  }
}`;
    }
    /**
     * Generate TypeScript interface for native bridge
     */
    generateTypeScriptInterface(moduleName, methods) {
        return `// ${moduleName}Bridge.ts
interface ${moduleName}Bridge {
  ${methods.map(method => {
            const methodName = method.split('(')[0];
            const params = method.match(/\w+:\s*\w+/g) || [];
            const paramString = params.length > 0 ? params.map(p => p.split(':')[0] + ': ' + p.split(':')[1]).join(', ') : '';
            return `${methodName}(${paramString}): Promise<{success: boolean}>;`;
        }).join('\n  ')}
}

declare module 'react-native' {
  interface NativeModulesStatic {
    ${moduleName}Bridge: ${moduleName}Bridge;
  }
}

export const ${moduleName}Bridge = NativeModules.${moduleName}Bridge;`;
    }
    /**
     * Generate Expo configuration
     */
    generateExpoConfig(appName, bundleIdentifier) {
        return `{
  "name": "${appName}",
  "slug": "${appName.toLowerCase().replace(/\s+/g, '-')}",
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "automatic",
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#ffffff"
  },
  "updates": {
    "fallbackToCacheTimeout": 0
  },
  "assetBundlePatterns": [
    "**/*"
  ],
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "${bundleIdentifier}"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#FFFFFF"
    },
    "package": "${bundleIdentifier}"
  },
  "web": {
    "favicon": "./assets/favicon.png"
  },
  "plugins": [
    "expo-camera",
    "expo-location",
    "expo-notifications"
  ]
}`;
    }
    /**
     * Generate React Navigation setup
     */
    generateReactNavigationSetup(screens) {
        return `import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="${screens[0]}">
        ${screens.map(screen => {
            return `        <Stack.Screen name="${screen}" component={${screen}Screen} />`;
        }).join('\n        ')}
      </Stack.Navigator>
    </NavigationContainer>
  );
}`;
    }
    /**
     * Generate platform-specific code files
     */
    generatePlatformSpecificFiles(componentName) {
        const iosCode = `// ${componentName}.ios.tsx
import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';

export function ${componentName}() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>iOS Specific ${componentName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  text: {
    fontSize: 18,
    color: '#007AFF'
  }
});`;
        const androidCode = `// ${componentName}.android.tsx
import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';

export function ${componentName}() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Android Specific ${componentName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  text: {
    fontSize: 18,
    color: '#3DDC84'
  }
});`;
        return { ios: iosCode, android: androidCode };
    }
    /**
     * Generate device permissions setup
     */
    generatePermissionsSetup(permissions) {
        return `import * as Permissions from 'expo-permissions';
import { Platform } from 'react-native';

export async function setupPermissions() {
  const results = {};

  ${permissions.map(permission => {
            return `  // ${permission} permission
  try {
    const { status } = await Permissions.askAsync(Permissions.${permission.toUpperCase()});
    results.${permission} = status === 'granted';
  } catch (error) {
    console.log('Error requesting ${permission} permission:', error);
    results.${permission} = false;
  }`;
        }).join('\n\n  ')}

  return results;
}`;
    }
    /**
     * Generate push notifications configuration
     */
    generatePushNotificationsConfig() {
        return `import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function configurePushNotifications() {
  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status !== 'granted') {
    console.log('Notification permissions not granted');
    return;
  }

  // Get push token
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Expo push token:', token);

  // Configure notification handling
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  return token;
}`;
    }
    /**
     * Generate app store deployment configuration
     */
    generateAppStoreConfig(appName, bundleId) {
        return `{
  "ios": {
    "appName": "${appName}",
    "bundleId": "${bundleId}",
    "buildNumber": "1.0.0",
    "version": "1.0.0",
    "appleId": "your-apple-id",
    "appleTeamId": "your-team-id",
    "provisioningProfile": "your-provisioning-profile",
    "certificate": "your-certificate"
  },
  "android": {
    "appName": "${appName}",
    "package": "${bundleId}",
    "versionCode": 1,
    "versionName": "1.0.0",
    "keystore": "your-keystore.keystore",
    "keystorePassword": "your-password",
    "keyAlias": "your-key-alias",
    "keyPassword": "your-key-password"
  },
  "eas": {
    "projectId": "your-eas-project-id",
    "buildProfile": "production",
    "channel": "production"
  }
}`;
    }
}
