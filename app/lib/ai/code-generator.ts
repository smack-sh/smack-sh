// app/lib/ai/code-generator.ts
import { generateDesktopAppSpecification, DesktopAppSpecification } from './desktop-generator';
import { scaffoldProject } from '../desktop-builder/scaffold';
import { buildDesktopApp, BuildTarget } from '../desktop-builder/build';
import { generateGitHubActionsWorkflow, generateElectronBuilderConfig } from '../desktop-builder/ci-cd'; // New import
import * as fs from 'fs/promises'; // Assuming this runs in a Node.js-like environment

export async function generateAndBuildDesktopApp(
  userPrompt: string,
  outputPath: string,
  target: BuildTarget,
): Promise<string> {
  console.log('Starting AI code generation pipeline...');

  // Step 1: AI generates desktop app specification from user prompt
  const appSpec: DesktopAppSpecification = await generateDesktopAppSpecification(userPrompt);
  console.log('Generated App Specification:', appSpec);

  // Step 2: Scaffold project based on the specification
  const projectPath = await scaffoldProject(appSpec.templateName, appSpec.projectName, outputPath);
  console.log(`Project scaffolded at: ${projectPath}`);

  // Step 3: AI generates code (placeholder)
  console.log('AI generating code for features and UI (placeholder)...');
  await fs.writeFile(
    `${projectPath}/GENERATED_FEATURES.md`,
    `# Generated Features for ${appSpec.projectName}\n\n` +
    `Template: ${appSpec.templateName}\n\n` +
    `## UI Description:\n${appSpec.uiDescription}\n\n` +
    `## Features:\n${appSpec.features.map(f => `- ${f}`).join('\n')}\n\n` +
    `_This file is a placeholder for AI-generated code._`
  );
  console.log('Placeholder code generated.');

  // Step 4: Generate CI/CD workflow and build configurations
  console.log('Generating CI/CD workflow and build configurations...');
  const workflowPath = await generateGitHubActionsWorkflow(appSpec, projectPath);
  console.log(`GitHub Actions workflow generated at: ${workflowPath}`);

  if (appSpec.templateName.includes('Electron')) {
    const electronBuilderConfigPath = await generateElectronBuilderConfig(appSpec, projectPath);
    if (electronBuilderConfigPath) {
      console.log(`Electron Builder config generated at: ${electronBuilderConfigPath}`);
    }
  }
  console.log('CI/CD configurations generated.');

  // Step 5: Build the desktop app
  console.log(`Building desktop app for target: ${target}...`);
  const buildResult = await buildDesktopApp(projectPath, target);
  console.log('Build successful:', buildResult.stdout);

  // Step 6: Prepare for download (e.g., zip the build output)
  console.log('App built and ready for download.');
  return projectPath;
}
