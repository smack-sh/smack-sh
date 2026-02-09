// app/lib/desktop-builder/scaffold.ts
import { templates, Template } from './templates';
import * as fs from 'fs/promises';

export async function scaffoldProject(
  templateName: string,
  projectName: string,
  outputPath: string,
): Promise<string> {
  const template = templates.find((t) => t.name === templateName);

  if (!template) {
    throw new Error(`Template "${templateName}" not found.`);
  }

  const projectPath = `${outputPath}/${projectName}`;

  // Check if directory already exists
  try {
    await fs.access(projectPath);
    throw new Error(`Directory "${projectPath}" already exists. Please choose a different project name or output path.`);
  } catch (error: any) {
    if (error.code !== 'ENOENT') { // ENOENT means "Error No Entry", i.e., directory does not exist
      throw error;
    }
    // Directory does not exist, which is good, continue
  }

  await template.generate(projectName, outputPath);
  return projectPath;
}
