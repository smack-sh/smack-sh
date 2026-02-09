# Smack Electron Application

This directory contains the Electron-specific code for the Smack desktop application.

## Development

To run the Electron application in development mode:

```bash
pnpm electron:dev
```

## Building

To build the Electron application for various platforms:

*   **Build for current OS (unpacked):**
    ```bash
    pnpm electron:build:unpack
    ```
*   **Build for macOS:**
    ```bash
    pnpm electron:build:mac
    ```
*   **Build for Windows:**
    ```bash
    pnpm electron:build:win
    ```
*   **Build for Linux:**
    ```bash
    pnpm electron:build:linux
    ```
*   **Build for macOS, Windows, and Linux (distribution):**
    ```bash
    pnpm electron:build:dist
    ```

## macOS Specific Behavior

On macOS, when you close the application window, the application typically continues to run in the background (its icon remains in the Dock). To fully quit the application, you must:

*   Select `Quit` from the application menu in the menu bar.
*   Use the keyboard shortcut `Cmd + Q`.

This behavior is standard for macOS applications and differs from Windows or Linux, where closing the window usually terminates the application process entirely.

## Platform Differences

*   **File System Access:** Electron applications have direct access to the local file system, unlike web applications running in a browser. This allows for features like local file storage, reading/writing user-specific configuration, and more robust file import/export capabilities.
*   **Native Menus and Dialogs:** Electron allows for the creation of native application menus, context menus, and file dialogs, providing a more integrated user experience compared to web-based UI elements.
*   **Notifications:** Native desktop notifications can be used, offering a more persistent and system-integrated way to alert users.
*   **Auto-Updates:** Electron applications can implement auto-update mechanisms to keep the application up-to-date seamlessly.
*   **Security:** While Electron provides powerful capabilities, it's crucial to follow security best practices (e.g., `contextIsolation`, `nodeIntegration: false`, Content Security Policy) to protect against potential vulnerabilities, as the application has access to system resources.
```