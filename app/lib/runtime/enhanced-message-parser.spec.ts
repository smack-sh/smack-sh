// app/lib/runtime/enhanced-message-parser.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedStreamingMessageParser } from './enhanced-message-parser';
import { StreamingMessageParser, type ParserCallbacks } from './message-parser';

// Mock the base StreamingMessageParser to isolate EnhancedStreamingMessageParser's logic
vi.mock('./message-parser', async (importOriginal) => {
  const actual = await importOriginal<typeof StreamingMessageParser>();
  return {
    ...actual,
    StreamingMessageParser: vi.fn(() => ({
      parse: vi.fn((messageId, input) => input), // Simply return input for base parse
      reset: vi.fn(),
    })),
  };
});

describe('EnhancedStreamingMessageParser', () => {
  let parser: EnhancedStreamingMessageParser;
  let callbacks: ParserCallbacks;

  beforeEach(() => {
    callbacks = {
      onArtifactOpen: vi.fn(),
      onArtifactClose: vi.fn(),
      onActionOpen: vi.fn(),
      onActionStream: vi.fn(),
      onActionClose: vi.fn(),
    };
    parser = new EnhancedStreamingMessageParser({ callbacks });
    vi.clearAllMocks();
  });

  it('should not modify input if artifacts are already present', () => {
    const messageId = 'msg1';
    const input = 'Text <smackArtifact id="test" title="Test" type="bundled"></smackArtifact>';
    const output = parser.parse(messageId, input);
    expect(output).toBe(input);
    expect(StreamingMessageParser.prototype.parse).toHaveBeenCalledWith(messageId, input);
  });

  describe('Shell Command Detection and Wrapping', () => {
    it('should wrap a simple shell command block', () => {
      const messageId = 'msg1';
      const input = '```bash\nls -la\n```';
      const output = parser.parse(messageId, input);
      expect(output).toContain('<smackArtifact id="artifact-msg1-0" title="Shell Command" type="shell">');
      expect(output).toContain('<smackAction type="shell">');
      expect(output).toContain('ls -la');
      expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(1);
      expect(callbacks.onActionOpen).toHaveBeenCalledTimes(1);
    });

    it('should wrap a multi-line shell command block', () => {
      const messageId = 'msg1';
      const input = `\`\`\`sh\ncd /tmp\nmkdir test\n\`\`\``;
      const output = parser.parse(messageId, input);
      expect(output).toContain('<smackAction type="shell">');
      expect(output).toContain('cd /tmp\nmkdir test');
    });

    it('should not wrap a shell script that looks like code', () => {
      const messageId = 'msg1';
      const input = `\`\`\`bash\nfunction hello() { echo "hi"; }\nhello\n\`\`\``;
      const output = parser.parse(messageId, input);
      expect(output).toBe(input); // Should not be wrapped as a shell action
      expect(callbacks.onArtifactOpen).not.toHaveBeenCalled();
    });

    it('should wrap a shell command with arguments and pipes', () => {
      const messageId = 'msg1';
      const input = `\`\`\`bash\ngit status | grep "modified"\n\`\`\``;
      const output = parser.parse(messageId, input);
      expect(output).toContain('<smackAction type="shell">');
      expect(output).toContain('git status | grep "modified"');
    });

    it('should handle different shell languages', () => {
      const messageId = 'msg1';
      const input = `\`\`\`powershell\nGet-Process | Select-Object -First 5\n\`\`\``;
      const output = parser.parse(messageId, input);
      expect(output).toContain('<smackAction type="shell">');
      expect(output).toContain('Get-Process | Select-Object -First 5');
    });
  });

  describe('File Path Detection and Wrapping', () => {
    it('should wrap a code block with explicit file path in comment', () => {
      const messageId = 'msg1';
      const input = `\`\`\`javascript\n// filename: src/index.js\nconsole.log("Hello");\n\`\`\``;
      const output = parser.parse(messageId, input);
      expect(output).toContain('<smackArtifact');
      expect(output).toContain('filePath="/src/index.js"');
      expect(output).toContain('console.log("Hello");');
      expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(1);
      expect(callbacks.onActionOpen).toHaveBeenCalledTimes(1);
    });

    it('should wrap a code block with explicit file path in text', () => {
      const messageId = 'msg1';
      const input = `Create file \`src/App.jsx\` with:\n\`\`\`jsx\nfunction App() { return <div>App</div>; }\n\`\`\``;
      const output = parser.parse(messageId, input);
      expect(output).toContain('<smackArtifact');
      expect(output).toContain('filePath="/src/App.jsx"');
      expect(output).toContain('function App() { return <div>App</div>; }');
    });

    it('should wrap a code block with file path in first line', () => {
      const messageId = 'msg1';
      const input = `src/components/Button.tsx:\n\`\`\`typescript\nexport const Button = () => {};\n\`\`\``;
      const output = parser.parse(messageId, input);
      expect(output).toContain('<smackArtifact');
      expect(output).toContain('filePath="/src/components/Button.tsx"');
      expect(output).toContain('export const Button = () => {};');
    });

    it('should infer file name from structured content (e.g., React component)', () => {
      const messageId = 'msg1';
      const input = `\`\`\`jsx\nfunction MyComponent() { return <div /> }\n\`\`\``;
      const output = parser.parse(messageId, input);
      expect(output).toContain('<smackArtifact');
      expect(output).toContain('filePath="/components/MyComponent.jsx"');
    });

    it('should infer file name for App component', () => {
      const messageId = 'msg1';
      const input = `\`\`\`jsx\nconst App = () => { return <div /> }\n\`\`\``;
      const output = parser.parse(messageId, input);
      expect(output).toContain('<smackArtifact');
      expect(output).toContain('filePath="/App.jsx"');
    });

    it('should not wrap if file path is invalid or excluded', () => {
      const messageId = 'msg1';
      const input1 = `\`\`\`javascript\n// filename: .tmp/temp.js\nconsole.log("temp");\n\`\`\``;
      const input2 = `\`\`\`bash\n// filename: output/log.txt\necho "log"\n\`\`\``;
      const input3 = `\`\`\`js\n// filename: invalid/path?.js\nconsole.log("invalid");\n\`\`\``;

      expect(parser.parse(messageId, input1)).toBe(input1);
      expect(parser.parse(messageId, input2)).toBe(input2);
      expect(parser.parse(messageId, input3)).toBe(input3);
      expect(callbacks.onArtifactOpen).not.toHaveBeenCalled();
    });

    it('should handle file operation pattern', () => {
      const messageId = 'msg1';
      const input = `create new file at \`src/utils/helper.js\` with the following content:\n\`\`\`javascript\nexport function help() { return true; }\n\`\`\``;
      const output = parser.parse(messageId, input);
      expect(output).toContain('<smackArtifact');
      expect(output).toContain('filePath="/src/utils/helper.js"');
      expect(output).toContain('export function help() { return true; }');
    });
  });

  it('should reset processed code blocks on reset()', () => {
    const messageId = 'msg1';
    const input = `\`\`\`bash\nls\n\`\`\``;
    parser.parse(messageId, input);
    expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(1);

    parser.reset();
    parser.parse(messageId, input); // Should be processed again
    expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(2);
  });
});
