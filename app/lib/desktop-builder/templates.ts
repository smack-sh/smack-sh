// app/lib/desktop-builder/templates.ts
import * as fs from 'fs/promises';

export interface Template {
  name: string;
  description: string;
  framework: 'electron' | 'tauri' | 'native';
  language: 'typescript' | 'javascript' | 'rust' | 'swift' | 'csharp';
  generate: (projectName: string, outputPath: string) => Promise<void>;
}

export const generateElectronReactTemplate: Template['generate'] = async (projectName, outputPath) => {
  const projectPath = `${outputPath}/${projectName}`;
  await fs.mkdir(projectPath, { recursive: true });

  // Basic package.json
  await fs.writeFile(
    `${projectPath}/package.json`,
    JSON.stringify(
      {
        name: projectName,
        version: '1.0.0',
        main: 'main.js',
        scripts: {
          start: 'electron .',
          react: 'react-scripts start',
          'electron-dev': 'concurrently "npm run react" "npm run start"',
        },
        devDependencies: {
          electron: '^28.0.0',
          'electron-builder': '^24.0.0',
          'react-scripts': '^5.0.0',
          concurrently: '^8.0.0',
        },
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
      },
      null,
      2,
    ),
  );

  // main.js (Electron main process)
  await fs.writeFile(
    `${projectPath}/main.js`,
    `
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL('http://localhost:3000'); // Assuming React dev server runs on 3000
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
`,
  );

  // preload.js (Electron preload script)
  await fs.writeFile(
    `${projectPath}/preload.js`,
    `
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(\`
${type}-version\`, process.versions[type]);
  }
});
`,
  );

  // public/index.html (React entry point)
  await fs.mkdir(`${projectPath}/public`, { recursive: true });
  await fs.writeFile(
    `${projectPath}/public/index.html`,
    `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${projectName}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script src="../src/index.js"></script>
  </body>
</html>
`,
  );

  // src/index.js (React app)
  await fs.mkdir(`${projectPath}/src`, { recursive: true });
  await fs.writeFile(
    `${projectPath}/src/index.js`,
    `
import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div>
      <h1>Hello from ${projectName} (React + Electron)!</h1>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`,
  );
};

export const electronReactTemplate: Template = {
  name: 'Electron + React',
  description: 'A basic Electron app with React frontend',
  framework: 'electron',
  language: 'javascript',
  generate: generateElectronReactTemplate,
};

export const generateElectronVueTemplate: Template['generate'] = async (projectName, outputPath) => {
  const projectPath = `${outputPath}/${projectName}`;
  await fs.mkdir(projectPath, { recursive: true });

  // Basic package.json
  await fs.writeFile(
    `${projectPath}/package.json`,
    JSON.stringify(
      {
        name: projectName,
        version: '1.0.0',
        main: 'main.js',
        scripts: {
          start: 'electron .',
          serve: 'vue-cli-service serve',
          'electron-dev': 'concurrently "npm run serve" "npm run start"',
        },
        devDependencies: {
          electron: '^28.0.0',
          'electron-builder': '^24.0.0',
          '@vue/cli-service': '^5.0.0',
          concurrently: '^8.0.0',
        },
        dependencies: {
          vue: '^3.0.0',
        },
      },
      null,
      2,
    ),
  );

  // main.js (Electron main process)
  await fs.writeFile(
    `${projectPath}/main.js`,
    `
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL('http://localhost:8080'); // Assuming Vue dev server runs on 8080
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
`,
  );

  // preload.js (Electron preload script)
  await fs.writeFile(
    `${projectPath}/preload.js`,
    `
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(\`\${type}-version\`, process.versions[type]);
  }
});
`,
  );

  // public/index.html (Vue entry point)
  await fs.mkdir(`${projectPath}/public`, { recursive: true });
  await fs.writeFile(
    `${projectPath}/public/index.html`,
    `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${projectName}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="app"></div>
    <!-- built files will be auto injected -->
  </body>
</html>
`,
  );

  // src/main.js (Vue app)
  await fs.mkdir(`${projectPath}/src`, { recursive: true });
  await fs.writeFile(
    `${projectPath}/src/main.js`,
    `
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
`,
  );

  // src/App.vue (Vue component)
  await fs.writeFile(
    `${projectPath}/src/App.vue`,
    `
<template>
  <div>
    <h1>Hello from {{ projectName }} (Vue + Electron)!</h1>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      projectName: '${projectName}',
    };
  },
};
</script>

<style>
/* Basic styles */
</style>
`,
  );
};

export const electronVueTemplate: Template = {
  name: 'Electron + Vue',
  description: 'A basic Electron app with Vue.js frontend',
  framework: 'electron',
  language: 'javascript',
  generate: generateElectronVueTemplate,
};

export const generateTauriReactTemplate: Template['generate'] = async (projectName, outputPath) => {
  const projectPath = `${outputPath}/${projectName}`;
  await fs.mkdir(projectPath, { recursive: true });

  // package.json
  await fs.writeFile(
    `${projectPath}/package.json`,
    JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          tauri: 'tauri',
        },
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
          '@tauri-apps/api': '^1.0.0',
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.0.0',
          vite: '^4.0.0',
          '@tauri-apps/cli': '^1.0.0',
        },
      },
      null,
      2,
    ),
  );

  // Cargo.toml
  await fs.mkdir(`${projectPath}/src-tauri`, { recursive: true });
  await fs.writeFile(
    `${projectPath}/src-tauri/Cargo.toml`,
    `
[package]
name = "${projectName}"
version = "0.1.0"
description = "A Tauri App"
authors = ["you"]
license = ""
repository = ""
default-run = "${projectName}"
edition = "2021"
rust-version = "1.60"

[build-dependencies]
tauri-build = { version = "1.0.0", features = [] }

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
tauri = { version = "1.0.0", features = ["api-all"] }
`,
  );

  // src-tauri/main.rs
  await fs.mkdir(`${projectPath}/src-tauri/src`, { recursive: true });
  await fs.writeFile(
    `${projectPath}/src-tauri/src/main.rs`,
    `
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
`,
  );

  // index.html
  await fs.writeFile(
    `${projectPath}/index.html`,
    `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
  );

  // src/main.jsx
  await fs.writeFile(
    `${projectPath}/src/main.jsx`,
    `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
  );

  // src/App.jsx
  await fs.writeFile(
    `${projectPath}/src/App.jsx`,
    `
import { useState } from 'react';
import reactLogo from './assets/react.svg';
import { invoke } from '@tauri-apps/api/tauri';
import './App.css';

function App() {
  const [greetMsg, setGreetMsg] = useState('');
  const [name, setName] = useState('');

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke('greet', { name }));
  }

  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <p>Click on the Tauri logo to learn more about the framework!</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      <p>{greetMsg}</p>
    </div>
  );
}

export default App;
`,
  );

  // src/styles.css
  await fs.writeFile(
    `${projectPath}/src/styles.css`,
    `
.container {
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  padding: 20px;
}
`,
  );

  // src/App.css
  await fs.writeFile(
    `${projectPath}/src/App.css`,
    `
.logo.vite:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

.logo.tauri:hover {
  filter: drop-shadow(0 0 2em #24c8d5aa);
}
`,
  );
};

export const tauriReactTemplate: Template = {
  name: 'Tauri + React',
  description: 'A basic Tauri app with React frontend',
  framework: 'tauri',
  language: 'javascript',
  generate: generateTauriReactTemplate,
};

export const generateSwiftTemplate: Template['generate'] = async (projectName, outputPath) => {
  const projectPath = `${outputPath}/${projectName}`;
  await fs.mkdir(projectPath, { recursive: true });

  // Package.swift
  await fs.writeFile(
    `${projectPath}/Package.swift`,
    `
// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "${projectName}",
    platforms: [.macOS(.v10_15)],
    products: [
        .executable(name: "${projectName}", targets: ["${projectName}"])
    ],
    targets: [
        .executableTarget(name: "${projectName}")
    ]
)
`,
  );

  // Sources/<projectName>/main.swift
  await fs.mkdir(`${projectPath}/Sources/${projectName}`, { recursive: true });
  await fs.writeFile(
    `${projectPath}/Sources/${projectName}/main.swift`,
    `
import Foundation

print("Hello, World from ${projectName} (Swift)!")
`,
  );
};

export const swiftTemplate: Template = {
  name: 'Native macOS (Swift)',
  description: 'A basic native macOS app using Swift Package Manager',
  framework: 'native',
  language: 'swift',
  generate: generateSwiftTemplate,
};

export const generateCSharpTemplate: Template['generate'] = async (projectName, outputPath) => {
  const projectPath = `${outputPath}/${projectName}`;
  await fs.mkdir(projectPath, { recursive: true });

  // .csproj file
  await fs.writeFile(
    `${projectPath}/${projectName}.csproj`,
    `
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

</Project>
`,
  );

  // Program.cs
  await fs.writeFile(
    `${projectPath}/Program.cs`,
    `
using System;

namespace ${projectName}
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World from ${projectName} (C#)!");
        }
    }
}
`,
  );
};

export const csharpTemplate: Template = {
  name: 'Native Windows (C#)',
  description: 'A basic native Windows console app using C# (.NET 8)',
  framework: 'native',
  language: 'csharp',
  generate: generateCSharpTemplate,
};

export const templates: Template[] = [
  electronReactTemplate,
  electronVueTemplate,
  tauriReactTemplate,
  swiftTemplate,
  csharpTemplate,
];
