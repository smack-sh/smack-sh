// tests/integration/desktop-builder.spec.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesktopBuilderUI } from '~/components/desktop-builder/DesktopBuilderUI';
import { generateAndBuildDesktopApp } from '~/lib/ai/code-generator';
import { templates } from '~/lib/desktop-builder/templates';
import { toast } from 'react-toastify';

// Mock generateAndBuildDesktopApp
vi.mock('~/lib/ai/code-generator', () => ({
  generateAndBuildDesktopApp: vi.fn(async (userPrompt, outputPath, target) => {
    if (userPrompt.includes('error')) {
      throw new Error('Simulated AI generation error');
    }
    // Simulate project creation and return a path
    return `/tmp/generated-desktop-apps/${userPrompt.replace(/\s/g, '-')}-project`;
  }),
}));

// Mock templates to control available options
vi.mock('~/lib/desktop-builder/templates', () => ({
  templates: [
    { name: 'Electron + React', framework: 'electron', language: 'javascript', generate: vi.fn() },
    { name: 'Tauri + React', framework: 'tauri', language: 'javascript', generate: vi.fn() },
  ],
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  ToastContainer: vi.fn(() => null),
}));

describe('Desktop Builder UI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for the placeholder code in DesktopBuilderUI
    global.fetch = vi.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve('// Mock generated code content'),
      }),
    ) as any;
  });

  it('should render the Desktop Builder UI', () => {
    render(<DesktopBuilderUI />);
    expect(screen.getByText('Desktop App Builder')).toBeInTheDocument();
    expect(screen.getByLabelText('User Requirements:')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Template:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate & Build App' })).toBeInTheDocument();
  });

  it('should enable the generate button when requirements and template are selected', async () => {
    render(<DesktopBuilderUI />);
    const generateButton = screen.getByRole('button', { name: 'Generate & Build App' });
    expect(generateButton).toBeDisabled();

    await userEvent.type(screen.getByLabelText('User Requirements:'), 'A simple app');
    await userEvent.selectOptions(screen.getByLabelText('Select Template:'), 'Electron + React');

    expect(generateButton).not.toBeDisabled();
  });

  it('should call generateAndBuildDesktopApp and update UI on successful generation', async () => {
    render(<DesktopBuilderUI />);
    const userRequirementsInput = screen.getByLabelText('User Requirements:');
    const templateSelect = screen.getByLabelText('Select Template:');
    const generateButton = screen.getByRole('button', { name: 'Generate & Build App' });

    await userEvent.type(userRequirementsInput, 'A simple Electron app');
    await userEvent.selectOptions(templateSelect, 'Electron + React');
    await userEvent.click(generateButton);

    expect(generateAndBuildDesktopApp).toHaveBeenCalledWith(
      'A simple Electron app',
      '/tmp/generated-desktop-apps',
      'electron-mac', // Default target in the UI component
    );

    await waitFor(() => {
      expect(screen.getByText('App generated and built successfully!')).toBeInTheDocument();
      expect(screen.getByText('// Mock generated code content')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Download Built App' })).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith('Desktop app generated and built!');
    });
  });

  it('should display an error message on failed generation', async () => {
    (generateAndBuildDesktopApp as vi.Mock).mockRejectedValueOnce(new Error('Simulated AI generation error'));

    render(<DesktopBuilderUI />);
    const userRequirementsInput = screen.getByLabelText('User Requirements:');
    const templateSelect = screen.getByLabelText('Select Template:');
    const generateButton = screen.getByRole('button', { name: 'Generate & Build App' });

    await userEvent.type(userRequirementsInput, 'An app with error');
    await userEvent.selectOptions(templateSelect, 'Electron + React');
    await userEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Error: Simulated AI generation error')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Error: Simulated AI generation error');
    });
  });

  it('should show loading state during generation', async () => {
    let resolveGenerate: (value: any) => void;
    (generateAndBuildDesktopApp as vi.Mock).mockImplementationOnce(() => {
      return new Promise((resolve) => {
        resolveGenerate = resolve;
      });
    });

    render(<DesktopBuilderUI />);
    const userRequirementsInput = screen.getByLabelText('User Requirements:');
    const templateSelect = screen.getByLabelText('Select Template:');
    const generateButton = screen.getByRole('button', { name: 'Generate & Build App' });

    await userEvent.type(userRequirementsInput, 'A loading app');
    await userEvent.selectOptions(templateSelect, 'Electron + React');
    await userEvent.click(generateButton);

    expect(generateButton).toBeDisabled();
    expect(screen.getByText('Processing...')).toBeInTheDocument();

    await act(async () => {
      resolveGenerate!('/tmp/generated-desktop-apps/loading-app-project');
    });

    await waitFor(() => {
      expect(generateButton).not.toBeDisabled();
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });
  });
});
