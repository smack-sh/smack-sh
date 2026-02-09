// app/lib/desktop-builder/templates.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { templates, Template } from './templates';
import * as fs from 'fs/promises';

// Mock fs/promises to prevent actual file system operations
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(() => Promise.resolve()),
  writeFile: vi.fn(() => Promise.resolve()),
  access: vi.fn(() => Promise.reject({ code: 'ENOENT' })), // Default: directory does not exist
}));

describe('Desktop App Templates', () => {
  const outputPath = '/tmp/test-output';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have at least one template defined', () => {
    expect(templates.length).toBeGreaterThan(0);
  });

  // Test Electron + React Template
  it('should generate Electron + React template correctly', async () => {
    const template = templates.find(t => t.name === 'Electron + React');
    expect(template).toBeDefined();
    if (!template) return;

    const projectName = 'MyElectronReactApp';
    await template.generate(projectName, outputPath);

    const projectPath = `${outputPath}/${projectName}`;
    expect(fs.mkdir).toHaveBeenCalledWith(projectPath, { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/package.json`,
      expect.stringContaining(`"name": "${projectName}"`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/main.js`,
      expect.stringContaining(`win.loadURL('http://localhost:3000');`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/preload.js`,
      expect.stringContaining(`window.addEventListener('DOMContentLoaded'`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/public/index.html`,
      expect.stringContaining(`<title>${projectName}</title>`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/src/index.js`,
      expect.stringContaining(`<h1>Hello from ${projectName} (React + Electron)!</h1>`),
    );
  });

  // Test Electron + Vue Template
  it('should generate Electron + Vue template correctly', async () => {
    const template = templates.find(t => t.name === 'Electron + Vue');
    expect(template).toBeDefined();
    if (!template) return;

    const projectName = 'MyElectronVueApp';
    await template.generate(projectName, outputPath);

    const projectPath = `${outputPath}/${projectName}`;
    expect(fs.mkdir).toHaveBeenCalledWith(projectPath, { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/package.json`,
      expect.stringContaining(`"name": "${projectName}"`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/main.js`,
      expect.stringContaining(`win.loadURL('http://localhost:8080');`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/preload.js`,
      expect.stringContaining(`window.addEventListener('DOMContentLoaded'`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/public/index.html`,
      expect.stringContaining(`<title>${projectName}</title>`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/src/main.js`,
      expect.stringContaining(`import App from './App.vue';`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/src/App.vue`,
      expect.stringContaining(`<h1>Hello from {{ projectName }} (Vue + Electron)!</h1>`),
    );
  });

  // Test Tauri + React Template
  it('should generate Tauri + React template correctly', async () => {
    const template = templates.find(t => t.name === 'Tauri + React');
    expect(template).toBeDefined();
    if (!template) return;

    const projectName = 'MyTauriReactApp';
    await template.generate(projectName, outputPath);

    const projectPath = `${outputPath}/${projectName}`;
    expect(fs.mkdir).toHaveBeenCalledWith(projectPath, { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/package.json`,
      expect.stringContaining(`"name": "${projectName}"`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/src-tauri/Cargo.toml`,
      expect.stringContaining(`name = "${projectName}"`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/src-tauri/src/main.rs`,
      expect.stringContaining(`tauri::Builder::default()`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/index.html`,
      expect.stringContaining(`<title>${projectName}</title>`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/src/main.jsx`,
      expect.stringContaining(`import App from './App';`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/src/App.jsx`,
      expect.stringContaining(`<h1>Welcome to Tauri!</h1>`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/src/styles.css`,
      expect.stringContaining(`.container {`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/src/App.css`,
      expect.stringContaining(`.logo.vite:hover {`),
    );
  });

  // Test Native macOS (Swift) Template
  it('should generate Native macOS (Swift) template correctly', async () => {
    const template = templates.find(t => t.name === 'Native macOS (Swift)');
    expect(template).toBeDefined();
    if (!template) return;

    const projectName = 'MySwiftApp';
    await template.generate(projectName, outputPath);

    const projectPath = `${outputPath}/${projectName}`;
    expect(fs.mkdir).toHaveBeenCalledWith(projectPath, { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/Package.swift`,
      expect.stringContaining(`name: "${projectName}"`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/Sources/${projectName}/main.swift`,
      expect.stringContaining(`Hello, World from ${projectName} (Swift)!`),
    );
  });

  // Test Native Windows (C#) Template
  it('should generate Native Windows (C#) template correctly', async () => {
    const template = templates.find(t => t.name === 'Native Windows (C#)');
    expect(template).toBeDefined();
    if (!template) return;

    const projectName = 'MyCSharpApp';
    await template.generate(projectName, outputPath);

    const projectPath = `${outputPath}/${projectName}`;
    expect(fs.mkdir).toHaveBeenCalledWith(projectPath, { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/${projectName}.csproj`,
      expect.stringContaining(`<OutputType>Exe</OutputType>`),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectPath}/Program.cs`,
      expect.stringContaining(`Console.WriteLine("Hello, World from ${projectName} (C#)!");`),
    );
  });
});
