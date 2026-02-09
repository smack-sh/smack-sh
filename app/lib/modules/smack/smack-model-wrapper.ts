/**
 * SmackModelWrapper - Wraps the Smack-7B model with request management and throttling
 */

import type {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1FinishReason,
  LanguageModelV1StreamPart,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { requestManager } from './request-manager';
import { serverManager } from './server-manager.server';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('SmackModelWrapper');

export class SmackModelWrapper implements LanguageModelV1 {
  readonly specificationVersion = 'v1';
  readonly provider = 'smack';
  readonly modelId = 'smack-7b';
  readonly maxTokens = 8192;

  private baseModel: LanguageModelV1;
  private serverUrl = 'http://127.0.0.1:8001/v1';

  constructor() {
    // Create the base OpenAI-compatible model
    const smackClient = createOpenAI({
      baseURL: this.serverUrl,
      apiKey: 'local-key', // Local server doesn't need real API key
    });

    this.baseModel = smackClient('smack-7b');
  }

  async doGenerate(options: LanguageModelV1CallOptions): Promise<{
    text?: string;
    toolCalls?: Array<{
      toolCallType: 'function';
      toolCallId: string;
      toolName: string;
      args: unknown;
    }>;
    finishReason: LanguageModelV1FinishReason;
    usage: {
      promptTokens: number;
      completionTokens: number;
    };
    rawCall: {
      rawPrompt: unknown;
      rawSettings: Record<string, unknown>;
    };
    warnings?: Array<{
      type: 'unsupported-setting';
      setting: string;
    }>;
  }> {
    // Check server health before processing
    const status = await serverManager.getStatus();

    if (!status.healthy) {
      throw new Error('Smack-7B server is not available. Please check server status.');
    }

    // Determine request priority based on prompt length and complexity
    const priority = this.calculateRequestPriority(options);

    // Queue the request through the request manager
    return await requestManager.queueRequest(
      async () => {
        try {
          return await this.baseModel.doGenerate(options);
        } catch (error) {
          logger.error('Smack-7B generation failed:', error);

          // Check if it's a server connectivity issue
          if (
            error instanceof Error &&
            (error.message.includes('ECONNREFUSED') ||
              error.message.includes('fetch failed') ||
              error.message.includes('network'))
          ) {
            throw new Error('Smack-7B server is not responding. The server may be starting up or experiencing issues.');
          }

          throw error;
        }
      },
      priority,
      60000, // 60 second timeout
    );
  }

  async doStream(options: LanguageModelV1CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV1StreamPart>;
    rawCall: {
      rawPrompt: unknown;
      rawSettings: Record<string, unknown>;
    };
    warnings?: Array<{
      type: 'unsupported-setting';
      setting: string;
    }>;
  }> {
    // Check server health before processing
    const status = await serverManager.getStatus();

    if (!status.healthy) {
      throw new Error('Smack-7B server is not available. Please check server status.');
    }

    // Determine request priority
    const priority = this.calculateRequestPriority(options);

    // Queue the streaming request
    return await requestManager.queueRequest(
      async () => {
        try {
          return await this.baseModel.doStream(options);
        } catch (error) {
          logger.error('Smack-7B streaming failed:', error);

          // Check if it's a server connectivity issue
          if (
            error instanceof Error &&
            (error.message.includes('ECONNREFUSED') ||
              error.message.includes('fetch failed') ||
              error.message.includes('network'))
          ) {
            throw new Error('Smack-7B server is not responding. The server may be starting up or experiencing issues.');
          }

          throw error;
        }
      },
      priority,
      120000, // 2 minute timeout for streaming
    );
  }

  /**
   * Calculate request priority based on prompt characteristics
   */
  private calculateRequestPriority(options: LanguageModelV1CallOptions): number {
    let priority = 1; // Default priority

    // Estimate prompt complexity
    const promptText = this.extractPromptText(options.prompt);
    const promptLength = promptText.length;

    // Higher priority for shorter prompts (likely quick questions)
    if (promptLength < 500) {
      priority = 3; // High priority
    } else if (promptLength < 2000) {
      priority = 2; // Medium priority
    } else {
      priority = 1; // Low priority for long prompts
    }

    // Adjust priority based on max tokens (shorter responses get higher priority)
    const maxTokens = options.maxTokens || 2048;

    if (maxTokens < 500) {
      priority = Math.min(priority + 1, 3);
    }

    // Check for code-related keywords (Smack-7B's specialty)
    const codeKeywords = [
      'function',
      'class',
      'import',
      'export',
      'const',
      'let',
      'var',
      'if',
      'else',
      'for',
      'while',
      'return',
      'async',
      'await',
      'python',
      'javascript',
      'typescript',
      'react',
      'node',
      'code',
      'debug',
      'fix',
      'implement',
      'refactor',
    ];

    const hasCodeKeywords = codeKeywords.some((keyword) => promptText.toLowerCase().includes(keyword));

    if (hasCodeKeywords) {
      priority = Math.min(priority + 1, 3); // Boost priority for code-related requests
    }

    return priority;
  }

  /**
   * Extract text content from prompt for analysis
   */
  private extractPromptText(prompt: any): string {
    if (typeof prompt === 'string') {
      return prompt;
    }

    if (Array.isArray(prompt)) {
      return prompt
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }

          if (item && typeof item === 'object' && 'text' in item) {
            return item.text;
          }

          if (item && typeof item === 'object' && 'content' in item) {
            return item.content;
          }

          return '';
        })
        .join(' ');
    }

    if (prompt && typeof prompt === 'object') {
      if ('text' in prompt) {
        return String(prompt.text);
      }

      if ('content' in prompt) {
        return String(prompt.content);
      }

      if ('messages' in prompt && Array.isArray(prompt.messages)) {
        return prompt.messages.map((msg: any) => msg.content || msg.text || '').join(' ');
      }
    }

    return String(prompt || '');
  }
}

/**
 * Create a new Smack-7B model instance with request management
 */
export function createSmackModel(): LanguageModelV1 {
  return new SmackModelWrapper();
}
