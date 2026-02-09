// tests/e2e/chat-mobile.spec.tsx
import React from 'react';
import { test, expect, Page } from '@playwright/test';

test.describe('Chat Interface on Mobile Viewports', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/'); // Assuming the chat interface is at the root
  });

  test('should hide desktop-only features on mobile', async ({ page, isMobile }: { page: Page; isMobile: boolean }) => {
    if (!isMobile) {
      test.skip('This test is for mobile viewports only.');
      return;
    }

    // Check if the Menu (sidebar) is hidden
    const menu = page.locator('.sidebar-menu'); // Assuming a class for the menu
    await expect(menu).toBeHidden();

    // Check if the Workbench is hidden
    const workbench = page.locator('.workbench'); // Assuming a class for the workbench
    await expect(workbench).toBeHidden();
  });

  test('should display mobile-optimized file upload UI', async ({ page, isMobile }: { page: Page; isMobile: boolean }) => {
    if (!isMobile) {
      test.skip('This test is for mobile viewports only.');
      return;
    }

    const uploadButton = page.getByRole('button', { name: /upload file/i });
    await expect(uploadButton).toBeVisible();
    // Check for the "Upload" text next to the icon
    await expect(uploadButton.locator('span', { hasText: 'Upload' })).toBeVisible();
    // Check for increased padding (this might be hard to assert directly,
    // but we can check for a class that implies it)
    await expect(uploadButton).toHaveClass(/p-2/); // Assuming 'p-2' class is added for mobile
  });

  test('should allow sending messages on mobile', async ({ page, isMobile }: { page: Page; isMobile: boolean }) => {
    if (!isMobile) {
      test.skip('This test is for mobile viewports only.');
      return;
    }

    const chatInput = page.getByPlaceholderText(/What would you like to discuss?/i);
    await expect(chatInput).toBeVisible();

    await chatInput.fill('Hello from mobile!');
    const sendButton = page.getByRole('button', { name: /send message/i });
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Assuming the message appears in the chat history
    await expect(page.getByText('Hello from mobile!')).toBeVisible();
  });

  // Add more tests for touch gestures if implemented
  test('should open context menu on long press for file tree items (simulated)', async ({ page, isMobile }: { page: Page; isMobile: boolean }) => {
    if (!isMobile) {
      test.skip('This test is for mobile viewports only.');
      return;
    }

    // Simulate a long press on a file tree item
    // This might require a specific locator and a custom action if Playwright's long press isn't direct
    // For now, we'll assume a right-click simulation might trigger it on some setups or mock it.
    // A more robust test would involve actual touch events if Playwright supports them directly.

    // Navigate to a page that has the file tree
    await page.goto('/workbench'); // Assuming workbench has the file tree

    // Create a dummy file in the file tree for testing
    // This would typically be done via API or by mocking the file system
    // For now, we'll assume a file exists.
    const fileTreeItem = page.locator('.file-tree-item').first(); // Assuming a class for file tree items
    await expect(fileTreeItem).toBeVisible();

    // Simulate long press (right-click)
    await fileTreeItem.click({ button: 'right' });

    // Check if the context menu is visible
    const contextMenu = page.locator('[role="menu"]'); // Assuming context menu has role="menu"
    await expect(contextMenu).toBeVisible();
    await expect(contextMenu.getByText('Move')).toBeVisible();
  });
  test('should invoke Flutter platform channel for folder import on mobile', async ({ page, isMobile }: { page: Page; isMobile: boolean }) => {
    if (!isMobile) {
      test.skip('This test is for mobile viewports only.');
      return;
    }

    // Mock the window.flutter_inappwebview object
    await page.evaluate(() => {
      // @ts-ignore - Mocking Flutter WebView
      window.flutter_inappwebview = {
        callHandler: (handlerName: string, ...args: any[]) => {
          // Store calls for assertion
          (window as any).flutterCallHandlerArgs = (window as any).flutterCallHandlerArgs || [];
          (window as any).flutterCallHandlerArgs.push({ handlerName, args });
          // Simulate a successful return for the folder picker
          if (handlerName === 'flutterApp' && args[0]?.type === 'folderPicker') {
            return Promise.resolve({
              folderName: 'mock-folder',
              files: [
                { name: 'file1.txt', path: 'file1.txt', content: btoa('Hello from file1'), isBinary: false },
                { name: 'file2.js', path: 'sub/file2.js', content: btoa('console.log("hi")'), isBinary: false },
              ],
            });
          }
          return Promise.resolve(null);
        },
      };
    });

    // Navigate to the chat page (where ImportFolderButton is)
    await page.goto('/');

    // Click the "Import Folder" button
    const importFolderButton = page.getByRole('button', { name: /import folder/i });
    await expect(importFolderButton).toBeVisible();
    await importFolderButton.click();

    // Assert that callHandler was invoked with correct arguments
    const callHandlerArgs = await page.evaluate(() => (window as any).flutterCallHandlerArgs);
    expect(callHandlerArgs).toEqual([
      { handlerName: 'flutterApp', args: [{ type: 'folderPicker' }] },
    ]);

    // Optionally, assert that toast success message appears after mock data is processed
    await expect(page.getByText('Folder imported successfully')).toBeVisible();
  });
});
