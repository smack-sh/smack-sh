// app/components/desktop-builder/DesktopBuilderUI.tsx
import React, { useState } from 'react';
import { classNames } from '~/utils/classNames';
import { DesktopEditor } from '~/components/workbench/DesktopEditor';
import { DesktopPreview } from '~/components/desktop-preview/DesktopPreview';
import { templates } from '~/lib/desktop-builder/templates';
import { generateAndBuildDesktopApp } from '~/lib/ai/code-generator';
import { BuildTarget } from '~/lib/desktop-builder/build';
import { toast } from 'react-toastify';

export const DesktopBuilderUI: React.FC = () => {
  const [userRequirements, setUserRequirements] = useState('');
  const [selectedTemplateName, setSelectedTemplateName] = useState(templates[0]?.name || '');
  const [generatedCode, setGeneratedCode] = useState('// Your generated code will appear here');
  const [previewUrl, setPreviewUrl] = useState('');
  const [buildStatus, setBuildStatus] = useState('');
  const [downloadPath, setDownloadPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateAndBuild = async () => {
    setIsLoading(true);
    setBuildStatus('Generating app specification...');
    setGeneratedCode('');
    setPreviewUrl('');
    setDownloadPath('');

    try {
      // For demonstration, we'll hardcode a target. In a real UI, this would be selectable.
      const target: BuildTarget = 'electron-mac'; // Example target

      const finalProjectPath = await generateAndBuildDesktopApp(
        userRequirements,
        '/tmp/generated-desktop-apps', // Temporary output path
        target
      );

      setBuildStatus('App generated and built successfully!');
      setDownloadPath(finalProjectPath); // In a real app, this would be a downloadable artifact URL

      // For web-based frameworks, we can set a preview URL
      if (selectedTemplateName.includes('Electron') || selectedTemplateName.includes('Tauri')) {
        setPreviewUrl('http://localhost:3000'); // Assuming dev server for preview
      }

      // Read a generated file to show in the editor (placeholder)
      // In a real scenario, AI would generate specific files.
      // For now, we'll just show the placeholder README.md
      const placeholderCode = await fetch(`${finalProjectPath}/GENERATED_FEATURES.md`).then(res => res.text());
      setGeneratedCode(placeholderCode);

      toast.success('Desktop app generated and built!');
    } catch (error: any) {
      setBuildStatus(`Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
      console.error('Desktop app generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <h2 className="text-xl font-bold">Desktop App Builder</h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="requirements" className="font-medium">User Requirements:</label>
        <textarea
          id="requirements"
          className="w-full p-2 border rounded-md bg-gray-700 text-gray-200"
          rows={4}
          value={userRequirements}
          onChange={(e) => setUserRequirements(e.target.value)}
          placeholder="Describe your desktop app (e.g., 'A simple Electron app with React, featuring file handling and notifications')."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="template" className="font-medium">Select Template:</label>
        <select
          id="template"
          className="w-full p-2 border rounded-md bg-gray-700 text-gray-200"
          value={selectedTemplateName}
          onChange={(e) => setSelectedTemplateName(e.target.value)}
        >
          {templates.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name} ({t.framework} - {t.language})
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleGenerateAndBuild}
        disabled={isLoading || !userRequirements || !selectedTemplateName}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Generate & Build App'}
      </button>

      {buildStatus && <p className="text-sm">{buildStatus}</p>}

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold mb-2">Generated Code</h3>
          <DesktopEditor code={generatedCode} onCodeChange={setGeneratedCode} className="flex-grow" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold mb-2">App Preview</h3>
          {previewUrl ? (
            <DesktopPreview url={previewUrl} className="flex-grow" />
          ) : (
            <div className="flex-grow flex items-center justify-center bg-gray-800 rounded-lg text-gray-400">
              No preview available for this template or app not running.
            </div>
          )}
        </div>
      </div>

      {downloadPath && (
        <div className="mt-4">
          <a href={downloadPath} download className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Download Built App
          </a>
        </div>
      )}
    </div>
  );
};
