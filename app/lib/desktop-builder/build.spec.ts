// app/lib/desktop-builder/build.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildDesktopApp, BuildTarget } from './build';
import { exec } from 'child_process';
import { promisify } from 'util';

// Mock child_process.exec
vi.mock('child_process', () => ({
  exec: vi.fn((command, options, callback) => {
    // Simulate successful command execution
    if (command.includes('error')) {
      callback(new Error('Simulated build error'), '', 'Simulated stderr');
    } else {
      callback(null, `Simulated stdout for: ${command}`, '');
    }
  }),
}));

// Mock promisify to return our mocked exec
vi.mock('util', () => ({
  promisify: vi.fn((fn) => {
    if (fn === exec) {
      return (command: string, options: any) => {
        return new Promise((resolve, reject) => {
          exec(command, options, (error: any, stdout: string, stderr: string) => {
            if (error) {
              reject(error);
            } else {
              resolve({ stdout, stderr });
            }
          });
        });
      };
    }
    return vi.fn();
  }),
}));

describe('buildDesktopApp', () => {
  const projectPath = '/tmp/test-project';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute the correct command for electron-mac target', async () => {
    const target: BuildTarget = 'electron-mac';
    await buildDesktopApp(projectPath, target);
    expect(exec).toHaveBeenCalledWith(
      'npm install && npm run build && electron-builder --mac',
      { cwd: projectPath },
      expect.any(Function),
    );
  });

  it('should execute the correct command for tauri-win target', async () => {
    const target: BuildTarget = 'tauri-win';
    await buildDesktopApp(projectPath, target);
    expect(exec).toHaveBeenCalledWith(
      'npm install && npm run build && tauri build --target win',
      { cwd: projectPath },
      expect.any(Function),
    );
  });

  it('should execute the correct command for swift-mac target', async () => {
    const target: BuildTarget = 'swift-mac';
    await buildDesktopApp(projectPath, target);
    expect(exec).toHaveBeenCalledWith(
      'swift build -c release',
      { cwd: projectPath },
      expect.any(Function),
    );
  });

  it('should execute the correct command for csharp-win target', async () => {
    const target: BuildTarget = 'csharp-win';
    await buildDesktopApp(projectPath, target);
    expect(exec).toHaveBeenCalledWith(
      'dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o publish',
      { cwd: projectPath },
      expect.any(Function),
    );
  });

  it('should return stdout and stderr on successful build', async () => {
    const target: BuildTarget = 'electron-mac';
    const result = await buildDesktopApp(projectPath, target);
    expect(result.stdout).toBe(`Simulated stdout for: npm install && npm run build && electron-builder --mac`);
    expect(result.stderr).toBe('');
  });

  it('should throw an error on build failure', async () => {
    const target: BuildTarget = 'electron-mac';
    // Simulate an error in the command string to trigger the mocked exec's error path
    await expect(buildDesktopApp(projectPath, `${target}-error` as BuildTarget)).rejects.toThrow(
      'Build failed for electron-mac-error: Simulated build error',
    );
  });

  it('should throw an error for unsupported build target', async () => {
    const target: BuildTarget = 'unsupported-target' as BuildTarget;
    await expect(buildDesktopApp(projectPath, target)).rejects.toThrow(
      `Unsupported build target: ${target}`,
    );
  });
});
