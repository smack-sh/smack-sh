// tests/e2e/desktop-builder.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Desktop App Generation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/desktop-builder'); // Assuming the desktop builder UI is at this route
  });

  test('should successfully generate, build, and offer download for an Electron app', async ({ page }) => {
    // Fill in user requirements
    await page.getByLabel('User Requirements:').fill('A simple Electron app with React and a button.');

    // Select template
    await page.getByLabel('Select Template:').selectOption('Electron + React');

    // Click generate and build button
    await page.getByRole('button', { name: 'Generate & Build App' }).click();

    // Expect success message
    await expect(page.getByText('App generated and built successfully!')).toBeVisible();
    await expect(page.getByText('Desktop app generated and built!')).toBeVisible(); // Toast message

    // Expect generated code to be visible
    await expect(page.getByText('// Mock generated code content')).toBeVisible();

    // Expect download link to be visible
    const downloadLink = page.getByRole('link', { name: 'Download Built App' });
    await expect(downloadLink).toBeVisible();
    await expect(downloadLink).toHaveAttribute('download');
    await expect(downloadLink).toHaveAttribute('href', /^\/tmp\/generated-desktop-apps\/.+-project$/); // Check for a path-like href
  });

  test('should display error on failed generation', async ({ page }) => {
    // Fill in user requirements that trigger an error in the mock
    await page.getByLabel('User Requirements:').fill('An app with error');

    // Select template
    await page.getByLabel('Select Template:').selectOption('Electron + React');

    // Click generate and build button
    await page.getByRole('button', { name: 'Generate & Build App' }).click();

    // Expect error message
    await expect(page.getByText('Error: Simulated AI generation error')).toBeVisible();
    await expect(page.getByText('Desktop app generation failed:')).toBeVisible(); // Console error
  });

  test('should show loading state during generation', async ({ page }) => {
    // Fill in user requirements
    await page.getByLabel('User Requirements:').fill('A loading app');

    // Select template
    await page.getByLabel('Select Template:').selectOption('Electron + React');

    // Click generate and build button
    const generateButton = page.getByRole('button', { name: 'Generate & Build App' });
    await generateButton.click();

    // Expect loading indicator
    await expect(generateButton).toBeDisabled();
    await expect(page.getByText('Processing...')).toBeVisible();

    // Wait for the process to complete (assuming it eventually does in a real scenario)
    await expect(page.getByText('App generated and built successfully!')).toBeVisible({ timeout: 30000 }); // Adjust timeout as needed
    await expect(generateButton).not.toBeDisabled();
    await expect(page.getByText('Processing...')).not.toBeVisible();
  });

  test('should display preview for web-based frameworks', async ({ page }) => {
    // Fill in user requirements
    await page.getByLabel('User Requirements:').fill('A simple Electron app');

    // Select template
    await page.getByLabel('Select Template:').selectOption('Electron + React');

    // Click generate and build button
    await page.getByRole('button', { name: 'Generate & Build App' }).click();

    // Expect preview iframe to be visible and loaded
    const previewIframe = page.frameLocator('iframe[title="Desktop App Preview"]');
    await expect(previewIframe.locator('body')).toBeVisible();
    // You might need to assert content within the iframe if the mock serves actual content
    // await expect(previewIframe.getByText('Hello from MyElectronReactApp (React + Electron)!')).toBeVisible();
  });

  test('should not display preview for native frameworks', async ({ page }) => {
    // Fill in user requirements
    await page.getByLabel('User Requirements:').fill('A simple Swift app');

    // Select template
    await page.getByLabel('Select Template:').selectOption('Native macOS (Swift)');

    // Click generate and build button
    await page.getByRole('button', { name: 'Generate & Build App' }).click();

    // Expect no preview message
    await expect(page.getByText('No preview available for this template or app not running.')).toBeVisible();
  });
});
