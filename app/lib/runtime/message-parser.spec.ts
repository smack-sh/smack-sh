// app/lib/runtime/message-parser.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StreamingMessageParser, ParserCallbacks, ArtifactCallbackData, ActionCallbackData } from './message-parser';

describe('StreamingMessageParser', () => {
  let parser: StreamingMessageParser;
  let callbacks: ParserCallbacks;

  beforeEach(() => {
    callbacks = {
      onArtifactOpen: vi.fn(),
      onArtifactClose: vi.fn(),
      onActionOpen: vi.fn(),
      onActionStream: vi.fn(),
      onActionClose: vi.fn(),
    };
    parser = new StreamingMessageParser({ callbacks });
  });

  it('should parse a complete message without artifacts or actions', () => {
    const messageId = 'msg1';
    const input = 'Hello, world!';
    const output = parser.parse(messageId, input);
    expect(output).toBe('Hello, world!');
    expect(callbacks.onArtifactOpen).not.toHaveBeenCalled();
    expect(callbacks.onActionOpen).not.toHaveBeenCalled();
  });

  it('should parse a message with a complete artifact tag', () => {
    const messageId = 'msg1';
    const input = 'Before <smackArtifact id="art1" title="My Artifact" type="bundled"></smackArtifact> After';
    const output = parser.parse(messageId, input);
    expect(output).toContain('<div class="__smackArtifact__"');
    expect(output).toContain('data-message-id="msg1"');
    expect(output).toContain('data-artifact-id="msg1-0"');
    expect(output).toContain('data-title="My Artifact"');
    expect(output).toContain('data-type="bundled"');
    expect(callbacks.onArtifactOpen).toHaveBeenCalledWith(expect.objectContaining({
      messageId: 'msg1',
      artifactId: 'msg1-0',
      title: 'My Artifact',
      type: 'bundled',
    }));
    expect(callbacks.onArtifactClose).toHaveBeenCalledWith(expect.objectContaining({
      messageId: 'msg1',
      artifactId: 'msg1-0',
      title: 'My Artifact',
      type: 'bundled',
    }));
  });

  it('should parse a message with a complete action tag inside an artifact', () => {
    const messageId = 'msg1';
    const input = 'Before <smackArtifact id="art1" title="My Artifact" type="bundled"><smackAction type="file" filePath="test.txt">Content</smackAction></smackArtifact> After';
    const output = parser.parse(messageId, input);
    expect(output).toContain('<div class="__smackArtifact__"');
    expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(1);
    expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
      artifactId: 'msg1-0',
      messageId: 'msg1',
      actionId: '0',
      action: { type: 'file', filePath: 'test.txt', content: '' },
    }));
    expect(callbacks.onActionStream).toHaveBeenCalledWith(expect.objectContaining({
      action: { type: 'file', filePath: 'test.txt', content: 'Content' },
    }));
    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      artifactId: 'msg1-0',
      messageId: 'msg1',
      actionId: '0',
      action: { type: 'file', filePath: 'test.txt', content: 'Content' },
    }));
    expect(callbacks.onArtifactClose).toHaveBeenCalledTimes(1);
  });

  it('should handle fragmented artifact tags', () => {
    const messageId = 'msg1';
    let output = parser.parse(messageId, 'Before <smackArtifact id="art1" title="My Artifact" type="bundled">');
    expect(output).toBe('Before ');
    expect(callbacks.onArtifactOpen).not.toHaveBeenCalled();

    output = parser.parse(messageId, '<smackAction type="file" filePath="test.txt">Content</smackAction></smackArtifact> After');
    expect(output).toContain('<div class="__smackArtifact__"');
    expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(1);
    expect(callbacks.onActionOpen).toHaveBeenCalledTimes(1);
    expect(callbacks.onActionClose).toHaveBeenCalledTimes(1);
    expect(callbacks.onArtifactClose).toHaveBeenCalledTimes(1);
  });

  it('should handle fragmented action tags', () => {
    const messageId = 'msg1';
    parser.parse(messageId, 'Before <smackArtifact id="art1" title="My Artifact" type="bundled"><smackAction type="file" filePath="test.txt">');
    expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(1);
    expect(callbacks.onActionOpen).toHaveBeenCalledTimes(1);
    expect(callbacks.onActionStream).not.toHaveBeenCalled();

    parser.parse(messageId, 'Content</smackAction></smackArtifact> After');
    expect(callbacks.onActionStream).toHaveBeenCalledWith(expect.objectContaining({
      action: { type: 'file', filePath: 'test.txt', content: 'Content' },
    }));
    expect(callbacks.onActionClose).toHaveBeenCalledTimes(1);
    expect(callbacks.onArtifactClose).toHaveBeenCalledTimes(1);
  });

  it('should handle malformed artifact tags (missing >)', () => {
    const messageId = 'msg1';
    const input = 'Before <smackArtifact id="art1" title="My Artifact" type="bundled" After';
    const output = parser.parse(messageId, input);
    expect(output).toBe('Before <smackArtifact id="art1" title="My Artifact" type="bundled" After');
    expect(callbacks.onArtifactOpen).not.toHaveBeenCalled();
  });

  it('should handle malformed action tags (missing >)', () => {
    const messageId = 'msg1';
    const input = 'Before <smackArtifact id="art1" title="My Artifact" type="bundled"><smackAction type="file" filePath="test.txt" Content</smackAction></smackArtifact> After';
    const output = parser.parse(messageId, input);
    expect(output).toContain('Before <div class="__smackArtifact__"');
    expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(1);
    expect(callbacks.onActionOpen).not.toHaveBeenCalled(); // Should not be called due to malformed tag
  });

  it('should handle empty chunks', () => {
    const messageId = 'msg1';
    const input = '';
    const output = parser.parse(messageId, input);
    expect(output).toBe('');
  });

  it('should handle large chunks', () => {
    const messageId = 'msg1';
    const largeContent = 'a'.repeat(2000); // Larger than typical chunk size
    const input = `Before <smackArtifact id="art1" title="My Artifact" type="bundled"><smackAction type="file" filePath="test.txt">${largeContent}</smackAction></smackArtifact> After`;
    const output = parser.parse(messageId, input);
    expect(output).toContain('<div class="__smackArtifact__"');
    expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(1);
    expect(callbacks.onActionOpen).toHaveBeenCalledTimes(1);
    expect(callbacks.onActionStream).toHaveBeenCalledWith(expect.objectContaining({
      action: { type: 'file', filePath: 'test.txt', content: largeContent },
    }));
    expect(callbacks.onActionClose).toHaveBeenCalledTimes(1);
    expect(callbacks.onArtifactClose).toHaveBeenCalledTimes(1);
  });

  it('should handle Unicode/emoji characters', () => {
    const messageId = 'msg1';
    const input = 'Hello 👋 <smackArtifact id="art1" title="My ✨ Artifact" type="bundled"><smackAction type="shell" command="echo 🌍">Output</smackAction></smackArtifact> World';
    const output = parser.parse(messageId, input);
    expect(output).toContain('<div class="__smackArtifact__"');
    expect(callbacks.onArtifactOpen).toHaveBeenCalledWith(expect.objectContaining({
      messageId: 'msg1',
      artifactId: 'msg1-0',
      title: 'My ✨ Artifact',
      type: 'bundled',
    }));
    expect(callbacks.onActionOpen).toHaveBeenCalledWith(expect.objectContaining({
      artifactId: 'msg1-0',
      messageId: 'msg1',
      actionId: '0',
      action: { type: 'shell', command: 'echo 🌍', content: '' },
    }));
    expect(callbacks.onActionStream).toHaveBeenCalledWith(expect.objectContaining({
      action: { type: 'shell', command: 'echo 🌍', content: 'Output' },
    }));
    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      artifactId: 'msg1-0',
      messageId: 'msg1',
      actionId: '0',
      action: { type: 'shell', command: 'echo 🌍', content: 'Output' },
    }));
    expect(callbacks.onArtifactClose).toHaveBeenCalledTimes(1);
  });

  it('should handle nested artifacts (though not officially supported, should not crash)', () => {
    const messageId = 'msg1';
    const input = 'Outer <smackArtifact id="outer" title="Outer" type="bundled">Inner <smackArtifact id="inner" title="Inner" type="bundled"></smackArtifact></smackArtifact>';
    const output = parser.parse(messageId, input);
    expect(output).toContain('<div class="__smackArtifact__"');
    expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(1); // Only outer should be parsed as artifact
    expect(callbacks.onArtifactOpen).toHaveBeenCalledWith(expect.objectContaining({
      artifactId: 'msg1-0',
      title: 'Outer',
    }));
    // The inner artifact tag will be treated as plain text within the outer artifact's content
    expect(output).toContain('Inner <smackArtifact id="inner" title="Inner" type="bundled">');
    expect(callbacks.onArtifactClose).toHaveBeenCalledTimes(1);
  });

  it('should handle action content exceeding MAX_CONTENT_LENGTH', () => {
    const messageId = 'msg1';
    const longContent = 'x'.repeat(1024 * 1024 + 100); // Exceeds 1MB
    const input = `<smackArtifact id="art1" title="Test" type="bundled"><smackAction type="file" filePath="long.txt">${longContent}</smackAction></smackArtifact>`;
    parser.parse(messageId, input);

    expect(callbacks.onActionClose).toHaveBeenCalledWith(expect.objectContaining({
      action: expect.objectContaining({
        content: expect.stringMatching(/^x{1048576}$/), // Should be truncated to MAX_CONTENT_LENGTH
        partial: true, // Should be marked as partial
      }),
    }));
  });

  it('should correctly parse multiple artifacts and actions', () => {
    const messageId = 'msg1';
    const input = `
      <smackArtifact id="art1" title="Artifact 1" type="bundled">
        <smackAction type="file" filePath="file1.txt">Content 1</smackAction>
      </smackArtifact>
      Some text in between.
      <smackArtifact id="art2" title="Artifact 2" type="bundled">
        <smackAction type="shell" command="ls">ls output</smackAction>
        <smackAction type="file" filePath="file2.txt">Content 2</smackAction>
      </smackArtifact>
    `;
    parser.parse(messageId, input);

    expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(2);
    expect(callbacks.onActionOpen).toHaveBeenCalledTimes(3);
    expect(callbacks.onActionClose).toHaveBeenCalledTimes(3);
    expect(callbacks.onArtifactClose).toHaveBeenCalledTimes(2);

    // Verify order and content of calls
    const allCalls = (callbacks.onArtifactOpen as any).mock.calls
      .concat((callbacks.onActionOpen as any).mock.calls)
      .concat((callbacks.onActionClose as any).mock.calls)
      .concat((callbacks.onArtifactClose as any).mock.calls);

    // This is a simplified check, a more robust test would verify the exact order and content
    expect(allCalls.some((call: any) => call[0].title === 'Artifact 1')).toBe(true);
    expect(allCalls.some((call: any) => call[0].action?.filePath === 'file1.txt')).toBe(true);
    expect(allCalls.some((call: any) => call[0].title === 'Artifact 2')).toBe(true);
    expect(allCalls.some((call: any) => call[0].action?.command === 'ls')).toBe(true);
    expect(allCalls.some((call: any) => call[0].action?.filePath === 'file2.txt')).toBe(true);
  });

  it('should reset state correctly', () => {
    const messageId = 'msg1';
    parser.parse(messageId, '<smackArtifact id="art1" title="Test" type="bundled">');
    expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(1);
    parser.reset();
    parser.parse(messageId, '<smackArtifact id="art2" title="Test2" type="bundled">');
    expect(callbacks.onArtifactOpen).toHaveBeenCalledTimes(2); // Should be called again for a new artifact
  });
});