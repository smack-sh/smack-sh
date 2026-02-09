// app/lib/desktop-builder/build.ts
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export type BuildTarget = 'electron-mac' | 'electron-win' | 'electron-linux' | 'tauri-mac' | 'tauri-win' | 'tauri-linux' | 'swift-mac' | 'csharp-win';

export async function buildDesktopApp(
  projectPath: string,
  target: BuildTarget,
): Promise<{ stdout: string; stderr: string }> {
  let command = '';
  let cwd = projectPath;

  switch (target) {
    case 'electron-mac':
    case 'electron-win':
    case 'electron-linux':
      // Assuming electron-builder is configured in the generated project's package.json
      // and the necessary build scripts are defined.
      // For simplicity, we'll use a generic build command here.
      // In a real scenario, you might need to run `npm install` first.
      command = `npm install && npm run build && electron-builder --${target.split('-')[1]}`;
      break;
    case 'tauri-mac':
    case 'tauri-win':
    case 'tauri-linux':
      // Assuming tauri CLI is installed globally or available in path
      command = `npm install && npm run build && tauri build --target ${target.split('-')[1]}`;
      break;
    case 'swift-mac':
      // For Swift Package Manager projects, build command would be `swift build`
      // For Xcode projects, it would be `xcodebuild`
      command = `swift build -c release`;
      break;
    case 'csharp-win':
      // For .NET projects
      command = `dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o publish`;
      break;
    default:
      throw new Error(`Unsupported build target: ${target}`);
  }

  console.log(`Executing build command: ${command} in ${cwd}`);

  try {
    const { stdout, stderr } = await execPromise(command, { cwd });
    console.log(`Build stdout: ${stdout}`);
    if (stderr) {
      console.error(`Build stderr: ${stderr}`);
    }
    return { stdout, stderr };
  } catch (error: any) {
    console.error(`Build failed: ${error.message}`);
    throw new Error(`Build failed for ${target}: ${error.message}`);
  }
}
