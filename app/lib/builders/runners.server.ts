import { exec } from 'node:child_process';

export type BuildRunnerResult = {
  success: boolean;
  command: string;
  stdout: string;
  stderr: string;
  artifactUrl?: string;
  error?: string;
};

async function commandExists(command: string): Promise<boolean> {
  try {
    await execAsync(`command -v ${command}`);
    return true;
  } catch {
    return false;
  }
}

async function execAsync(command: string, cwd?: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

async function runCommand(command: string, cwd?: string): Promise<BuildRunnerResult> {
  try {
    const { stdout, stderr } = await execAsync(command, cwd);
    return { success: true, command, stdout, stderr };
  } catch (error) {
    return {
      success: false,
      command,
      stdout: '',
      stderr: '',
      error: error instanceof Error ? error.message : 'Command failed',
    };
  }
}

export async function runTauriBuild(projectRoot: string): Promise<BuildRunnerResult> {
  if (!(await commandExists('pnpm'))) {
    return {
      success: false,
      command: 'pnpm tauri:build',
      stdout: '',
      stderr: '',
      error: 'pnpm not available on runtime host',
    };
  }

  return runCommand('pnpm tauri:build', projectRoot);
}

export async function runFlutterBuildApk(projectRoot: string): Promise<BuildRunnerResult> {
  if (!(await commandExists('flutter'))) {
    return {
      success: false,
      command: 'flutter build apk',
      stdout: '',
      stderr: '',
      error: 'flutter not available on runtime host',
    };
  }

  return runCommand('flutter build apk --release', `${projectRoot}/mobile`);
}

export async function runEasBuild(projectRoot: string): Promise<BuildRunnerResult> {
  if (!(await commandExists('eas'))) {
    return {
      success: false,
      command: 'eas build --platform android',
      stdout: '',
      stderr: '',
      error: 'eas cli not available on runtime host',
    };
  }

  return runCommand('eas build --platform android --non-interactive', projectRoot);
}
