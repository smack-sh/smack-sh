import { useState } from 'react';

const formatters = [
  {
    id: 'prettier',
    name: 'Prettier',
    description: 'Code formatter for JavaScript, TypeScript, CSS, and more',
    languages: ['javascript', 'typescript', 'css', 'scss', 'json', 'markdown'],
    config: {
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
    },
  },
  {
    id: 'black',
    name: 'Black',
    description: 'Python code formatter',
    languages: ['python'],
    config: {
      lineLength: 88,
      stringQuotes: 'double',
    },
  },
  {
    id: 'gofmt',
    name: 'gofmt',
    description: 'Go code formatter',
    languages: ['go'],
    config: {},
  },
  {
    id: 'rustfmt',
    name: 'rustfmt',
    description: 'Rust code formatter',
    languages: ['rust'],
    config: {
      edition: '2021',
      maxWidth: 100,
    },
  },
];

export function CodeFormatter() {
  const [selectedFormatter, setSelectedFormatter] = useState(formatters[0]);
  const [inputCode, setInputCode] = useState(`function exampleFunction(param1, param2) {
  // This is a sample function
  const result = param1 + param2;
  return result;
}

console.log(exampleFunction(5, 10));`);
  const [outputCode, setOutputCode] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);

  const formatCode = async () => {
    setIsFormatting(true);

    try {
      // Simulate formatting - in real app, call actual formatter API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock formatted output
      let formatted = '';

      switch (selectedFormatter.id) {
        case 'prettier':
          formatted = `function exampleFunction(param1, param2) {
  // This is a sample function
  const result = param1 + param2;
  return result;
}

console.log(exampleFunction(5, 10));`;
          break;
        case 'black':
          formatted = `def example_function(param1, param2):
    # This is a sample function
    result = param1 + param2
    return result


print(example_function(5, 10))`;
          break;
        case 'gofmt':
          formatted = `package main

import "fmt"

func exampleFunction(param1, param2 int) int {
	// This is a sample function
	result := param1 + param2
	return result
}

func main() {
	fmt.Println(exampleFunction(5, 10))
}`;
          break;
        case 'rustfmt':
          formatted = `fn example_function(param1: i32, param2: i32) -> i32 {
    // This is a sample function
    let result = param1 + param2;
    result
}

fn main() {
    println!("{}", example_function(5, 10));
}`;
          break;
      }

      setOutputCode(formatted);
    } catch (error) {
      console.error('Formatting error:', error);
    } finally {
      setIsFormatting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);

      // Show success toast
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Code Formatter</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Format your code with industry-standard formatters</p>
      </div>

      {/* Formatter Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {formatters.map((formatter) => (
          <button
            key={formatter.id}
            onClick={() => setSelectedFormatter(formatter)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedFormatter.id === formatter.id
                ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <h3 className="font-medium text-gray-900 dark:text-white">{formatter.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{formatter.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {formatter.languages.slice(0, 2).map((lang) => (
                <span
                  key={lang}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  {lang}
                </span>
              ))}
              {formatter.languages.length > 2 && (
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  +{formatter.languages.length - 2}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Input Code</label>
            <button
              onClick={() => setInputCode('')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Clear
            </button>
          </div>
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Paste your code here..."
            className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white font-mono text-sm resize-none"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Formatted Code</label>
            <div className="flex gap-2">
              <button
                onClick={formatCode}
                disabled={isFormatting || !inputCode.trim()}
                className="px-3 py-1 text-sm bg-accent-600 text-white rounded hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50"
              >
                {isFormatting ? 'Formatting...' : 'Format'}
              </button>
              {outputCode && (
                <button
                  onClick={() => copyToClipboard(outputCode)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Copy
                </button>
              )}
            </div>
          </div>
          <textarea
            value={outputCode}
            readOnly
            placeholder="Formatted code will appear here..."
            className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 font-mono text-sm resize-none"
          />
        </div>
      </div>

      {/* Formatter Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {selectedFormatter.name} Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(selectedFormatter.config).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {typeof value === 'boolean' ? (value ? 'true' : 'false') : value}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
            Advanced Configuration
          </button>
        </div>
      </div>

      {/* Supported Languages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Supported Languages</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {selectedFormatter.languages.map((lang) => (
            <div key={lang} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
          Format from File
        </button>
        <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
          Format Multiple Files
        </button>
        <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
          Save as Template
        </button>
      </div>
    </div>
  );
}
