// app/lib/desktop-builder/scaffold.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scaffoldProject } from './scaffold';
import * as fs from 'fs/promises';
import { templates } from './templates';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(() => Promise.resolve()),
  writeFile: vi.fn(() => Promise.resolve()),
  access: vi.fn(() => Promise.reject({ code: 'ENOENT' })), // Default: directory does not exist
}));

// Mock templates
vi.mock('./templates', () => ({
  templates: [
    {
      name: 'Test Template',
      description: 'A test template',
      framework: 'electron',
      language: 'javascript',
      generate: vi.fn(() => Promise.resolve()),
    },
    {
      name: 'Another Template',
      description: 'Another test template',
      framework: 'tauri',
      language: 'rust',
      generate: vi.fn(() => Promise.resolve()),
    },
  ],
}));

describe('scaffoldProject', () => {
  const outputPath = '/tmp/scaffold-test';
  const projectName = 'MyScaffoldedApp';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset access mock to default (ENOENT)
    (fs.access as vi.Mock).mockImplementation(() => Promise.reject({ code: 'ENOENT' }));
  });

  it('should scaffold a project using the specified template', async () => {
    const templateName = 'Test Template';
    const projectPath = await scaffoldProject(templateName, projectName, outputPath);

    expect(projectPath).toBe(`${outputPath}/${projectName}`);
    expect(fs.access).toHaveBeenCalledWith(projectPath);
    expect(templates[0].generate).toHaveBeenCalledWith(projectName, outputPath);
    expect(fs.mkdir).not.toHaveBeenCalled(); // mkdir is called by template.generate
  });

  it('should throw an error if the template is not found', async () => {
    const templateName = 'NonExistent Template';
    await expect(scaffoldProject(templateName, projectName, outputPath)).rejects.toThrow(
      `Template "${templateName}" not found.`,
    );
  });

  it('should throw an error if the project directory already exists', async () => {
    (fs.access as vi.Mock).mockImplementation(() => Promise.resolve()); // Simulate directory exists

    const templateName = 'Test Template';
    await expect(scaffoldProject(templateName, projectName, outputPath)).rejects.toThrow(
      `Directory "${outputPath}/${projectName}" already exists. Please choose a different project name or output path.`,
    );
  });

  it('should handle other file system access errors', async () => {
    (fs.access as vi.Mock).mockImplementation(() => Promise.reject(new Error('Permission denied')));

    const templateName = 'Test Template';
    await expect(scaffoldProject(templateName, projectName, outputPath)).rejects.toThrow('Permission denied');
  });
});
