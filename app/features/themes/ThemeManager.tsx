import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';

const themes = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright theme',
    colors: {
      background: '#ffffff',
      surface: '#f8fafc',
      primary: '#1e293b',
      secondary: '#64748b',
      accent: '#3b82f6',
      border: '#e2e8f0',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes for night coding',
    colors: {
      background: '#0f172a',
      surface: '#1e293b',
      primary: '#f1f5f9',
      secondary: '#94a3b8',
      accent: '#60a5fa',
      border: '#334155',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Modern dark theme with slate colors',
    colors: {
      background: '#0f172a',
      surface: '#1e293b',
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      accent: '#6366f1',
      border: '#475569',
    },
  },
  {
    id: 'monokai',
    name: 'Monokai',
    description: 'Popular dark theme for code editors',
    colors: {
      background: '#272822',
      surface: '#3e3d32',
      primary: '#f8f8f2',
      secondary: '#90908a',
      accent: '#fd971f',
      border: '#49483e',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    description: 'Popular dark theme with purple accents',
    colors: {
      background: '#282a36',
      surface: '#44475a',
      primary: '#f8f8f2',
      secondary: '#6272a4',
      accent: '#bd93f9',
      border: '#6272a4',
    },
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    description: "GitHub's light theme",
    colors: {
      background: '#ffffff',
      surface: '#f6f8fa',
      primary: '#24292e',
      secondary: '#6a737d',
      accent: '#0366d6',
      border: '#d1d9e0',
    },
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    description: "GitHub's dark theme",
    colors: {
      background: '#0d1117',
      surface: '#161b22',
      primary: '#f0f6fc',
      secondary: '#8b949e',
      accent: '#238636',
      border: '#30363d',
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'High contrast for accessibility',
    colors: {
      background: '#000000',
      surface: '#1a1a1a',
      primary: '#ffffff',
      secondary: '#cccccc',
      accent: '#ffff00',
      border: '#666666',
    },
  },
];

export function ThemeManager() {
  const currentTheme = useStore(themeStore);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [customColors, setCustomColors] = useState(
    themes.find((t) => t.id === currentTheme)?.colors || themes[0].colors,
  );
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    setSelectedTheme(currentTheme);
    setCustomColors(themes.find((t) => t.id === currentTheme)?.colors || themes[0].colors);
  }, [currentTheme]);

  const applyTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);

    if (theme) {
      themeStore.set(themeId);
      setCustomColors(theme.colors);
      setIsCustomMode(false);
    }
  };

  const applyCustomTheme = () => {
    // Apply custom colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--smack-background', customColors.background);
    root.style.setProperty('--smack-surface', customColors.surface);
    root.style.setProperty('--smack-primary', customColors.primary);
    root.style.setProperty('--smack-secondary', customColors.secondary);
    root.style.setProperty('--smack-accent', customColors.accent);
    root.style.setProperty('--smack-border', customColors.border);

    themeStore.set('custom');
    setIsCustomMode(true);
  };

  const resetToDefault = () => {
    applyTheme('dark');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Theme Manager</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Customize your coding environment</p>
      </div>

      {/* Current Theme Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Current Theme Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">Background</div>
            <div className="h-12 rounded" style={{ backgroundColor: customColors.background }}></div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">Surface</div>
            <div className="h-12 rounded" style={{ backgroundColor: customColors.surface }}></div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">Accent</div>
            <div className="h-12 rounded" style={{ backgroundColor: customColors.accent }}></div>
          </div>
        </div>
      </div>

      {/* Preset Themes */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preset Themes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTheme === theme.id
                  ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{theme.name}</h4>
                {selectedTheme === theme.id && (
                  <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{theme.description}</p>
              <div className="grid grid-cols-3 gap-1">
                {Object.entries(theme.colors)
                  .slice(0, 3)
                  .map(([key, color]) => (
                    <div
                      key={key}
                      className="h-4 rounded-sm border border-gray-200 dark:border-gray-600"
                      style={{ backgroundColor: color }}
                      title={key}
                    ></div>
                  ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Theme Builder */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Custom Theme</h3>
          <button
            onClick={() => setIsCustomMode(!isCustomMode)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {isCustomMode ? 'Hide' : 'Show'} Builder
          </button>
        </div>

        {isCustomMode && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(customColors).map(([key, color]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                    {key}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setCustomColors((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="h-10 w-16 rounded border border-gray-300 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setCustomColors((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={applyCustomTheme}
                className="px-4 py-2 bg-accent-600 text-white rounded-md hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
              >
                Apply Custom Theme
              </button>
              <button
                onClick={resetToDefault}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Reset to Default
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Theme Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-switch theme</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically switch between light and dark based on system preference
              </p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-900 transition-transform bg-accent-600 translate-x-6"></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reduce motion</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Minimize animations and transitions</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-900 transition-transform translate-x-1"></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">High contrast</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Increase contrast for better readability</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-900 transition-transform translate-x-1"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
