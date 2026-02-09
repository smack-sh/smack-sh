import { createScopedLogger } from '~/utils/logger';
import { StreamingMessageParser, type StreamingMessageParserOptions } from './message-parser';

const logger = createScopedLogger('EnhancedMessageParser');

/**
 * Enhanced message parser that detects code blocks and file patterns
 * even when AI models don't wrap them in proper artifact tags.
 * Fixes issue #1797 where code outputs to chat instead of files.
 */
export class EnhancedStreamingMessageParser extends StreamingMessageParser {
  private _processedCodeBlocks = new Map<string, Set<string>>();
  private _artifactCounter = 0;

  // Optimized command pattern lookup
  private _commandPatternMap = new Map<string, RegExp>([
    ['npm', /^(npm|yarn|pnpm)\s+(install|run|start|build|dev|test|init|create|add|remove)/],
    ['git', /^(git)\s+(add|commit|push|pull|clone|status|checkout|branch|merge|rebase|init|remote|fetch|log)/],
    ['docker', /^(docker|docker-compose)\s+/],
    ['build', /^(make|cmake|gradle|mvn|cargo|go)\s+/],
    ['network', /^(curl|wget|ping|ssh|scp|rsync)\s+/],
    ['webcontainer', /^(cat|chmod|cp|echo|hostname|kill|ln|ls|mkdir|mv|ps|pwd|rm|rmdir|xxd)\s*/],
    ['webcontainer-extended', /^(alias|cd|clear|env|false|getconf|head|sort|tail|touch|true|uptime|which)\s*/],
    ['interpreters', /^(node|python|python3|java|go|rust|ruby|php|perl)\s+/],
    ['text-processing', /^(grep|sed|awk|cut|tr|sort|uniq|wc|diff)\s+/],
    ['archive', /^(tar|zip|unzip|gzip|gunzip)\s+/],
    ['process', /^(ps|top|htop|kill|killall|jobs|nohup)\s*/],
    ['system', /^(df|du|free|uname|whoami|id|groups|date|uptime)\s*/],
  ]);

  constructor(options: StreamingMessageParserOptions = {}) {
    super(options);
  }

  parse(messageId: string, input: string): string {
    // First try the normal parsing
    let output = super.parse(messageId, input);

    // If no artifacts were detected, check for code blocks that should be files
    if (!this._hasDetectedArtifacts(input)) {
      const enhancedInput = this._detectAndWrapCodeBlocks(messageId, input);

      if (enhancedInput !== input) {
        // Reset and reparse with enhanced input
        this.reset();
        output = super.parse(messageId, enhancedInput);
      }
    }

    return output;
  }

  private _hasDetectedArtifacts(input: string): boolean {
    return input.includes('<smackArtifact') || input.includes('</smackArtifact>');
  }

  private _detectAndWrapCodeBlocks(messageId: string, input: string): string {
    if (!this._processedCodeBlocks.has(messageId)) {
      this._processedCodeBlocks.set(messageId, new Set());
    }
    const processed = this._processedCodeBlocks.get(messageId)!;
    let enhanced = input;

    try {
      enhanced = this._detectAndWrapShellCommands(messageId, enhanced, processed);
    } catch (error) {
      logger.error('Error during shell command detection and wrapping', { error });
    }

    const patterns = [
      { regex: /(?:^|\n)([\/\w\-\.]+\.\w+):?\s*\n+```(\w*)\n([\s\S]*?)```/gim, type: 'file_path' },
      {
        regex:
          /(?:create|update|modify|edit|write|add|generate|here'?s?|file:?)\s+(?:a\s+)?(?:new\s+)?(?:file\s+)?(?:called\s+)?[`'"]*([\/\w\-\.]+\.\w+)[`'"]*:?\s*\n+```(\w*)\n([\s\S]*?)```/gi,
        type: 'explicit_create',
      },
      {
        regex: /```(\w*)\n(?:\/\/|#|<!--)\s*(?:file:?|filename:?)\s*([\/\w\-\.]+\.\w+).*?\n([\s\S]*?)```/gi,
        type: 'comment_filename',
      },
      {
        regex: /(?:in|for|update)\s+[`'"]*([\/\w\-\.]+\.\w+)[`'"]*:?\s*\n+```(\w*)\n([\s\S]*?)```/gi,
        type: 'in_filename',
      },
      {
        regex:
          /```(?:json|jsx?|tsx?|html?|vue|svelte)\n(\{[\s\S]*?"(?:name|version|scripts|dependencies|devDependencies)"[\s\S]*?\}|<\w+[^>]*>[\s\S]*?<\/\w+>[\s\S]*?)```/gi,
        type: 'structured_file',
      },
    ];

    for (const pattern of patterns) {
      try {
        enhanced = enhanced.replace(pattern.regex, (match, ...args) => {
          const blockHash = this._hashBlock(match);
          if (processed.has(blockHash)) return match;

          let filePath: string | undefined;
          let language: string | undefined;
          let content: string | undefined;

          if (pattern.type === 'comment_filename') {
            [language, filePath, content] = args;
          } else if (pattern.type === 'structured_file') {
            content = args[0];
            language = pattern.regex.source.includes('json') ? 'json' : 'jsx';
            if (content) {
              filePath = this._inferFileNameFromContent(content, language);
            }
          } else {
            [filePath, language, content] = args;
          }

          if (!filePath || !content) {
            return match;
          }

          if (this._isShellCommand(content, language || '')) {
            processed.add(blockHash);
            logger.debug('Auto-wrapped code block as shell command instead of file');
            return this._wrapInShellAction(content, messageId);
          }

          filePath = this._normalizeFilePath(filePath);
          if (!this._isValidFilePath(filePath)) return match;

          if (!this._hasFileContext(enhanced, match)) {
            const isExplicitFilePattern =
              pattern.type === 'explicit_create' || pattern.type === 'comment_filename' || pattern.type === 'file_path';
            if (!isExplicitFilePattern) return match;
          }

          processed.add(blockHash);
          const artifactId = `artifact-${messageId}-${this._artifactCounter++}`;
          const wrapped = this._wrapInArtifact(artifactId, filePath, content);
          logger.debug(`Auto-wrapped code block as file: ${filePath}`);
          return wrapped;
        });
      } catch (error) {
        logger.error(`Error processing pattern ${pattern.type}`, { error });
      }
    }

    try {
      const fileOperationPattern =
        /(?:create|write|save|generate)\s+(?:a\s+)?(?:new\s+)?file\s+(?:at\s+)?[`'"]*([\/\w\-\.]+\.\w+)[`'"]*\s+with\s+(?:the\s+)?(?:following\s+)?content:?\s*\n([\s\S]+?)(?=\n\n|\n(?:create|write|save|generate|now|next|then|finally)|$)/gi;
      enhanced = enhanced.replace(fileOperationPattern, (match, filePath, content) => {
        if (!filePath || !content) return match;
        const blockHash = this._hashBlock(match);
        if (processed.has(blockHash)) return match;

        filePath = this._normalizeFilePath(filePath);
        if (!this._isValidFilePath(filePath)) return match;

        processed.add(blockHash);
        const artifactId = `artifact-${messageId}-${this._artifactCounter++}`;
        content = content.trim();
        const wrapped = this._wrapInArtifact(artifactId, filePath, content);
        logger.debug(`Auto-wrapped file operation: ${filePath}`);
        return wrapped;
      });
    } catch (error) {
      logger.error('Error during file operation detection', { error });
    }

    return enhanced;
  }

  private _wrapInArtifact(artifactId: string, filePath: string, content: string): string {
    const title = filePath.split('/').pop() || 'File';

    return `<smackArtifact id="${artifactId}" title="${title}" type="bundled">
<smackAction type="file" filePath="${filePath}">
${content}
</smackAction>
</smackArtifact>`;
  }

  private _wrapInShellAction(content: string, messageId: string): string {
    const artifactId = `artifact-${messageId}-${this._artifactCounter++}`;

    return `<smackArtifact id="${artifactId}" title="Shell Command" type="shell">
<smackAction type="shell">
${content.trim()}
</smackAction>
</smackArtifact>`;
  }

  private _normalizeFilePath(filePath: string): string {
    if (!filePath) return '';
    filePath = filePath.replace(/[`'"]/g, '').trim();
    filePath = filePath.replace(/\\/g, '/');
    if (filePath.startsWith('./')) {
      filePath = filePath.substring(2);
    }
    if (!filePath.startsWith('/') && !filePath.startsWith('.')) {
      filePath = '/' + filePath;
    }
    return filePath;
  }

  private _isValidFilePath(filePath: string): boolean {
    if (!filePath) return false;
    const hasExtension = /\.\w+$/.test(filePath);
    if (!hasExtension) return false;

    const isValid = /^[\/\w\-\.]+$/.test(filePath);
    if (!isValid) return false;

    const excludePatterns = [
      /^\/?(tmp|temp|test|example)\//i,
      /\.(tmp|temp|bak|backup|old|orig)$/i,
      /^\/?(output|result|response)\//i,
      /^code_\d+\.(sh|bash|zsh)$/i,
      /^(untitled|new|demo|sample)\d*\./i,
    ];

    return !excludePatterns.some((pattern) => pattern.test(filePath));
  }

  private _hasFileContext(input: string, codeBlockMatch: string): boolean {
    const matchIndex = input.indexOf(codeBlockMatch);
    if (matchIndex === -1) return false;

    const beforeContext = input.substring(Math.max(0, matchIndex - 200), matchIndex);
    const afterContext = input.substring(matchIndex + codeBlockMatch.length, matchIndex + codeBlockMatch.length + 100);

    const fileContextPatterns = [
      /\b(create|write|save|add|update|modify|edit|generate)\s+(a\s+)?(new\s+)?file/i,
      /\b(file|filename|filepath)\s*[:=]/i,
      /\b(in|to|as)\s+[`'"]?[\w\-\.\/]+\.[a-z]{2,4}[`'"]?/i,
      /\b(component|module|class|function)\s+\w+/i,
    ];

    const contextText = beforeContext + afterContext;
    return fileContextPatterns.some((pattern) => pattern.test(contextText));
  }

  private _inferFileNameFromContent(content: string, language: string): string {
    if (!content) return `/component-${Date.now()}.jsx`;
    const componentMatch = content.match(
      /(?:function|class|const|export\s+default\s+function|export\s+function)\s+(\w+)/,
    );

    if (componentMatch && componentMatch[1]) {
      const name = componentMatch[1];
      const ext = language === 'jsx' ? '.jsx' : language === 'tsx' ? '.tsx' : '.js';
      return `/components/${name}${ext}`;
    }

    if (content.includes('function App') || content.includes('const App')) {
      return '/App.jsx';
    }

    return `/component-${Date.now()}.jsx`;
  }

  private _hashBlock(content: string): string {
    if (!content) return '';
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private _isShellCommand(content: string, language: string): boolean {
    if (!language || !content) return false;
    const shellLanguages = ['bash', 'sh', 'shell', 'zsh', 'fish', 'powershell', 'ps1'];
    if (!shellLanguages.includes(language.toLowerCase())) return false;

    const trimmedContent = content.trim();
    const lines = trimmedContent.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return false;

    if (this._looksLikeScriptContent(trimmedContent)) return false;
    if (lines.length === 1) return this._isSingleLineCommand(lines[0]);

    return this._isCommandSequence(lines);
  }

  private _isSingleLineCommand(line: string): boolean {
    if (!line) return false;
    const hasChaining = /[;&|]{1,2}/.test(line);
    if (hasChaining) {
      const parts = line.split(/[;&|]{1,2}/).map((p) => p.trim());
      return parts.every((part) => part.length > 0 && !this._looksLikeScriptContent(part));
    }

    const prefixPatterns = [/^sudo\s+/, /^time\s+/, /^nohup\s+/, /^watch\s+/, /^env\s+\w+=\w+\s+/];
    let cleanLine = line;
    for (const prefix of prefixPatterns) {
      cleanLine = cleanLine.replace(prefix, '');
    }

    for (const [, pattern] of this._commandPatternMap) {
      if (pattern.test(cleanLine)) return true;
    }

    return this._isSimpleCommand(cleanLine);
  }

  private _isCommandSequence(lines: string[]): boolean {
    if (!lines || lines.length === 0) return false;
    const commandLikeLines = lines.filter(
      (line) => line && !line.startsWith('#') && (this._isSingleLineCommand(line) || this._isSimpleCommand(line)),
    );
    return commandLikeLines.length / lines.length > 0.7;
  }

  private _isSimpleCommand(line: string): boolean {
    if (!line) return false;
    const words = line.split(/\s+/);
    if (words.length === 0) return false;
    const firstWord = words[0];
    if (!firstWord) return false;

    if (line.includes('=') && !line.startsWith('export ') && !line.startsWith('env ') && !firstWord.includes('='))
      return false;
    if (line.includes('function ') || line.match(/^\w+\s*\(\s*\)/)) return false;
    if (/^(if|for|while|case|function|until|select)\s/.test(line)) return false;
    if (line.includes('<<') || line.startsWith('EOF') || line.startsWith('END')) return false;
    if (line.includes('"""') || line.includes("'''")) return false;

    const commandLikePatterns = [
      /^[a-z][a-z0-9-_]*$/i,
      /^\.\/[a-z0-9-_./]+$/i,
      /^\/[a-z0-9-_./]+$/i,
      /^[a-z][a-z0-9-_]*\s+-.+/i,
    ];

    return commandLikePatterns.some((pattern) => pattern.test(firstWord));
  }

  private _looksLikeScriptContent(content: string): boolean {
    if (!content) return false;
    const lines = content.trim().split('\n');
    const scriptIndicators = [
      /^#!/,
      /function\s+\w+/,
      /^\w+\s*\(\s*\)\s*\{/,
      /^(if|for|while|case)\s+.*?(then|do|in)/,
      /^\w+=[^=].*$/,
      /^(local|declare|readonly)\s+/,
      /^(source|\.)\s+/,
      /^(exit|return)\s+\d+/,
    ];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) continue;
      if (scriptIndicators.some((pattern) => pattern.test(trimmedLine))) return true;
    }
    return false;
  }

  private _detectAndWrapShellCommands(_messageId: string, input: string, processed: Set<string>): string {
    const shellCommandPattern = /```(bash|sh|shell|zsh|fish|powershell|ps1)\n([\s\S]*?)```/gi;
    try {
      return input.replace(shellCommandPattern, (match, language, content) => {
        if (!language || !content) return match;
        const blockHash = this._hashBlock(match);
        if (processed.has(blockHash)) return match;

        if (this._isShellCommand(content, language)) {
          processed.add(blockHash);
          logger.debug(`Auto-wrapped shell code block as command: ${language}`);
          return this._wrapInShellAction(content, _messageId);
        }
        return match;
      });
    } catch (error) {
      logger.error('Error in _detectAndWrapShellCommands', { error });
      return input;
    }
  }

  reset() {
    super.reset();
    this._processedCodeBlocks.clear();
    this._artifactCounter = 0;
  }
}
