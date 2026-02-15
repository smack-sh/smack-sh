import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { generateId, type ToolSet, type TextStreamPart } from 'ai';
import { formatDataStreamPart } from '@ai-sdk/ui-utils';
import { MAX_RESPONSE_SEGMENTS, type FileMap } from '~/lib/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/common/prompts/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import type { IProviderSetting } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';
import { getFilePaths, selectContext } from '~/lib/.server/llm/select-context';
import type { ContextAnnotation, ProgressAnnotation } from '~/types/context';
import { WORK_DIR } from '~/utils/constants';
import { createSummary } from '~/lib/.server/llm/create-summary';
import { extractPropertiesFromMessage } from '~/lib/.server/llm/utils';
import type { DesignScheme } from '~/types/design-scheme';
import { MCPService } from '~/lib/services/mcpService';
import { generateGeminiText } from '~/lib/builders/gemini.server';

type DataStreamWriterCompat = {
  write: (chunk: string) => void;
  writeData: (data: unknown) => void;
  writeMessageAnnotation: (annotation: unknown) => void;
};

function createDataStreamCompat({
  execute,
  onError,
}: {
  execute: (writer: DataStreamWriterCompat) => Promise<void> | void;
  onError?: (error: any) => string;
}): ReadableStream<string> {
  let controller: ReadableStreamDefaultController<string> | null = null;
  const stream = new ReadableStream<string>({
    start(c) {
      controller = c;
    },
  });

  const writer: DataStreamWriterCompat = {
    write(chunk) {
      controller?.enqueue(chunk);
    },
    writeData(data) {
      const payload = Array.isArray(data) ? data : [data];
      controller?.enqueue(formatDataStreamPart('data', payload));
    },
    writeMessageAnnotation(annotation) {
      const payload = Array.isArray(annotation) ? annotation : [annotation];
      controller?.enqueue(formatDataStreamPart('message_annotations', payload));
    },
  };

  (async () => {
    try {
      await execute(writer);
    } catch (error: any) {
      const message = onError ? onError(error) : String(error?.message ?? error);
      controller?.enqueue(formatDataStreamPart('error', message));
    } finally {
      controller?.close();
    }
  })();

  return stream;
}

async function mergeResultIntoDataStream(
  result: {
    fullStream: AsyncIterable<TextStreamPart<ToolSet>>;
    finishReason: Promise<string>;
    totalUsage: Promise<any>;
  },
  writer: DataStreamWriterCompat,
) {
  for await (const part of result.fullStream) {
    switch (part.type) {
      case 'text-delta':
        writer.write(formatDataStreamPart('text', part.text));
        break;
      case 'reasoning-delta':
        writer.write(formatDataStreamPart('reasoning', part.text));
        break;
      case 'tool-input-start':
        writer.write(
          formatDataStreamPart('tool_call_streaming_start', {
            toolCallId: part.id,
            toolName: part.toolName,
          }),
        );
        break;
      case 'tool-input-delta':
        writer.write(
          formatDataStreamPart('tool_call_delta', {
            toolCallId: part.id,
            argsTextDelta: part.delta,
          }),
        );
        break;
      case 'tool-call':
        writer.write(
          formatDataStreamPart('tool_call', {
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            args: part.args,
          }),
        );
        break;
      case 'tool-result':
        writer.write(
          formatDataStreamPart('tool_result', {
            toolCallId: part.toolCallId,
            result: part.result,
          }),
        );
        break;
      case 'source':
        writer.write(formatDataStreamPart('source', part));
        break;
      case 'file':
        writer.write(formatDataStreamPart('file', part.file));
        break;
      case 'finish-step':
        writer.write(
          formatDataStreamPart('finish_step', {
            finishReason: part.finishReason,
            usage: part.usage,
            isContinued: false,
          }),
        );
        break;
      case 'error': {
        const message = (part.error as any)?.message ?? String(part.error);
        writer.write(formatDataStreamPart('error', message));
        break;
      }
      default:
        break;
    }
  }

  const finishReason = await result.finishReason;
  const usage = await result.totalUsage;
  writer.write(
    formatDataStreamPart('finish_message', {
      finishReason,
      usage,
    }),
  );
}

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

const logger = createScopedLogger('api.chat');

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');

    if (name && rest.length) {
      try {
        const decodedName = decodeURIComponent(name.trim());
        const decodedValue = decodeURIComponent(rest.join('=').trim());
        cookies[decodedName] = decodedValue;
      } catch (e) {
        logger.error(`Failed to decode cookie item: ${item}`, e);
      }
    }
  });

  return cookies;
}

function getLastUserPrompt(messages: Messages): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && typeof messages[i].content === 'string') {
      return messages[i].content;
    }
  }

  return '';
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  try {
    const body = await request.json<{
      messages: Messages;
      files: any;
      promptId?: string;
      contextOptimization: boolean;
      chatMode: 'discuss' | 'build';
      designScheme?: DesignScheme;
      supabase?: {
        isConnected: boolean;
        hasSelectedProject: boolean;
        credentials?: {
          anonKey?: string;
          supabaseUrl?: string;
        };
      };
      maxLLMSteps: number;
    }>();

    if (
      !body.messages ||
      !Array.isArray(body.messages) ||
      body.messages.some((m) => m.id === undefined || m.role === undefined || m.content === undefined)
    ) {
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Invalid request body: messages are required and must have id, role, and content.',
          statusCode: 400,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { messages, files, promptId, contextOptimization, supabase, chatMode, designScheme, maxLLMSteps } = body;

    const cookieHeader = request.headers.get('Cookie');
    const cookies = parseCookies(cookieHeader || '');

    let apiKeys = {};

    try {
      if (cookies.apiKeys) {
        apiKeys = JSON.parse(cookies.apiKeys);
      }
    } catch (e) {
      logger.error('Failed to parse apiKeys cookie', e);
    }

    let providerSettings: Record<string, IProviderSetting> = {};

    try {
      if (cookies.providers) {
        providerSettings = JSON.parse(cookies.providers);
      }
    } catch (e) {
      logger.error('Failed to parse providers cookie', e);
    }

    const cumulativeUsage = {
      completionTokens: 0,
      promptTokens: 0,
      totalTokens: 0,
    };
    const encoder: TextEncoder = new TextEncoder();
    let progressCounter: number = 1;
    let lastChunk: string | undefined = undefined;

    const dataStream = createDataStreamCompat({
      async execute(dataStream) {
        const mcpService = MCPService.getInstance();
        const filePaths = getFilePaths(files || {});
        let filteredFiles: FileMap | undefined = undefined;
        let summary: string | undefined = undefined;
        let messageSliceId = 0;

        const processedMessages = await mcpService.processToolInvocations(messages, dataStream);

        if (processedMessages.length > 3) {
          messageSliceId = processedMessages.length - 3;
        }

        if (filePaths.length > 0 && contextOptimization) {
          dataStream.writeData({
            type: 'progress',
            label: 'summary',
            status: 'in-progress',
            order: progressCounter++,
            message: 'Analysing Request',
          } satisfies ProgressAnnotation);

          summary = await createSummary({
            messages: [...processedMessages],
            env: context.cloudflare?.env,
            apiKeys,
            providerSettings,
            promptId,
            contextOptimization,
            onFinish(resp) {
              if (resp.usage) {
                cumulativeUsage.completionTokens += resp.usage.completionTokens || 0;
                cumulativeUsage.promptTokens += resp.usage.promptTokens || 0;
                cumulativeUsage.totalTokens += resp.usage.totalTokens || 0;
              }
            },
          });
          dataStream.writeData({
            type: 'progress',
            label: 'summary',
            status: 'complete',
            order: progressCounter++,
            message: 'Analysis Complete',
          } satisfies ProgressAnnotation);
          dataStream.writeMessageAnnotation({
            type: 'chatSummary',
            summary,
            chatId: processedMessages.slice(-1)?.[0]?.id,
          } as ContextAnnotation);

          dataStream.writeData({
            type: 'progress',
            label: 'context',
            status: 'in-progress',
            order: progressCounter++,
            message: 'Determining Files to Read',
          } satisfies ProgressAnnotation);

          filteredFiles = await selectContext({
            messages: [...processedMessages],
            env: context.cloudflare?.env,
            apiKeys,
            files,
            providerSettings,
            promptId,
            contextOptimization,
            summary,
            onFinish(resp) {
              if (resp.usage) {
                cumulativeUsage.completionTokens += resp.usage.completionTokens || 0;
                cumulativeUsage.promptTokens += resp.usage.promptTokens || 0;
                cumulativeUsage.totalTokens += resp.usage.totalTokens || 0;
              }
            },
          });

          if (filteredFiles) {
            dataStream.writeMessageAnnotation({
              type: 'codeContext',
              files: Object.keys(filteredFiles || {}).map((key) => {
                let path = key;

                if (path.startsWith(WORK_DIR)) {
                  path = path.replace(WORK_DIR, '');
                }

                return path;
              }),
            } as ContextAnnotation);
          }

          dataStream.writeData({
            type: 'progress',
            label: 'context',
            status: 'complete',
            order: progressCounter++,
            message: 'Code Files Selected',
          } satisfies ProgressAnnotation);
        }

        const options: StreamingOptions = {
          supabaseConnection: supabase,
          toolChoice: 'auto',
          tools: mcpService.toolsWithoutExecute,
          maxSteps: maxLLMSteps,
          onStepFinish: ({ toolCalls }) => {
            toolCalls.forEach((toolCall) => mcpService.processToolCall(toolCall, dataStream));
          },
          onFinish: async ({ text: content, finishReason, usage }) => {
            if (usage) {
              cumulativeUsage.completionTokens += usage.completionTokens || 0;
              cumulativeUsage.promptTokens += usage.promptTokens || 0;
              cumulativeUsage.totalTokens += usage.totalTokens || 0;
            }

            if (finishReason !== 'length') {
              dataStream.writeMessageAnnotation({
                type: 'usage',
                value: { ...cumulativeUsage },
              });
              dataStream.writeData({
                type: 'progress',
                label: 'response',
                status: 'complete',
                order: progressCounter++,
                message: 'Response Generated',
              } satisfies ProgressAnnotation);
              await new Promise((resolve) => setTimeout(resolve, 0));

              return;
            }

            if (new SwitchableStream().switches >= MAX_RESPONSE_SEGMENTS) {
              throw new Error('Cannot continue message: Maximum segments reached');
            }

            const lastUserMessage = processedMessages.filter((x) => x.role === 'user').slice(-1)[0];

            if (!lastUserMessage) {
              throw new Error('Cannot continue: No user message found to extract properties from.');
            }

            const { model, provider } = extractPropertiesFromMessage(lastUserMessage);
            processedMessages.push({ id: generateId(), role: 'assistant', content });
            processedMessages.push({
              id: generateId(),
              role: 'user',
              content: `[Model: ${model}]\n\n[Provider: ${provider}]\n\n${CONTINUE_PROMPT}`,
            });

            const result = await streamText({
              messages: [...processedMessages],
              env: context.cloudflare?.env,
              options,
              apiKeys,
              files,
              providerSettings,
              promptId,
              contextOptimization,
              contextFiles: filteredFiles,
              chatMode,
              designScheme,
              summary,
              messageSliceId,
            });

            await mergeResultIntoDataStream(result, dataStream);
          },
        };

        dataStream.writeData({
          type: 'progress',
          label: 'response',
          status: 'in-progress',
          order: progressCounter++,
          message: 'Generating Response',
        } satisfies ProgressAnnotation);

        let result;

        try {
          result = await streamText({
            messages: [...processedMessages],
            env: context.cloudflare?.env,
            options,
            apiKeys,
            files,
            providerSettings,
            promptId,
            contextOptimization,
            contextFiles: filteredFiles,
            chatMode,
            designScheme,
            summary,
            messageSliceId,
          });
        } catch (error: any) {
          const message = String(error?.message || '');

          if (message.includes('Unsupported model version v1')) {
            const fallbackText = await generateGeminiText({
              systemPrompt: 'You are Smack AI assistant. Provide concise, practical coding help.',
              userPrompt: getLastUserPrompt(processedMessages),
              model: process.env.DEFAULT_MODEL || 'gemini-2.5-flash',
            });

            if (fallbackText) {
              dataStream.write(formatDataStreamPart('text', fallbackText));
              dataStream.write(
                formatDataStreamPart('finish_step', {
                  finishReason: 'stop',
                  usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 },
                  isContinued: false,
                }),
              );
              dataStream.write(
                formatDataStreamPart('finish_message', {
                  finishReason: 'stop',
                  usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 },
                }),
              );
              streamRecovery.stop();

              return;
            }
          }

          throw error;
        }

        (async () => {
          for await (const part of result.fullStream) {
            if (part.type === 'error') {
              const error: any = part.error;
              logger.error('Streaming error:', error);

              const { type, message, retryable, httpCode } = getErrorDetails(error.message);
              dataStream.writeData({ type: 'error', error: { type, message, retryable, httpCode } });

              return;
            }
          }
          streamRecovery.stop();
        })();
        await mergeResultIntoDataStream(result, dataStream);
      },
      onError: (error: any) => {
        const { message } = getErrorDetails(error.message);
        return message;
      },
    }).pipeThrough(
      new TransformStream({
        transform: (chunk, controller) => {
          if (typeof chunk !== 'string') {
            const str = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(str));

            return;
          }

          if (!lastChunk) {
            lastChunk = ' ';
          }

          if (chunk.startsWith('g') && !lastChunk.startsWith('g')) {
            controller.enqueue(encoder.encode(`0: "<div class=\\"__smackThought__\\">"\\n`));
          }

          if (lastChunk.startsWith('g') && !chunk.startsWith('g')) {
            controller.enqueue(encoder.encode(`0: "</div>\\n"`));
          }

          lastChunk = chunk;

          let transformedChunk = chunk;

          if (chunk.startsWith('g')) {
            try {
              const parts = chunk.split(':');

              if (parts.length > 1) {
                let content = parts.slice(1).join(':');

                if (content.endsWith('\n')) {
                  content = content.slice(0, -1);
                }

                transformedChunk = `0:${content}\n`;
              } else {
                throw new Error('Invalid chunk format');
              }
            } catch (error) {
              logger.warn('Failed to parse streaming chunk', { chunk, error });

              const warningPayload = { type: 'warning', message: 'Could not parse a streaming chunk.' };
              controller.enqueue(encoder.encode(`8: ${JSON.stringify(warningPayload)}\n`));
              transformedChunk = chunk;
            }
          }

          const str = transformedChunk;
          controller.enqueue(encoder.encode(str));
        },
      }),
    );

    return new Response(dataStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        'Text-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    logger.error(error);

    const { type, message, retryable, httpCode } = getErrorDetails(error.message);
    const errorResponse = {
      error: true,
      type,
      message,
      statusCode: httpCode,
      isRetryable: retryable,
      provider: error.provider || 'unknown',
    };

    return new Response(JSON.stringify(errorResponse), {
      status: httpCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function getErrorDetails(errorMessage: string) {
  errorMessage = errorMessage || 'Unknown error';

  let type = 'unknown';
  let retryable = true;
  let httpCode = 500;
  let message = `An unexpected error occurred: ${errorMessage}`;

  if (errorMessage.includes('model') && errorMessage.includes('not found')) {
    type = 'auth_failure';
    retryable = false;
    httpCode = 400;
    message = 'Invalid model selected. Please check that the model name is correct and available.';
  } else if (errorMessage.includes('Not implemented in client')) {
    type = 'configuration_error';
    retryable = false;
    httpCode = 500;
    message = 'Server provider configuration is invalid. Please restart the app and verify provider wiring.';
  } else if (errorMessage.includes('Unsupported model version v1')) {
    type = 'configuration_error';
    retryable = false;
    httpCode = 500;
    message = 'Model adapter mismatch detected. Using fallback generation path.';
  } else if (
    errorMessage.includes('API key') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication')
  ) {
    type = 'auth_failure';
    retryable = false;
    httpCode = 401;
    message = 'Invalid or missing API key. Please check your API key configuration.';
  } else if (errorMessage.includes('token') && errorMessage.includes('limit')) {
    type = 'token_limit';
    retryable = false;
    httpCode = 429;
    message = 'Token limit exceeded. The conversation is too long for the selected model.';
  } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    type = 'rate_limit';
    retryable = true;
    httpCode = 429;
    message = 'API rate limit exceeded. Please wait a moment before trying again.';
  } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
    type = 'network_timeout';
    retryable = true;
    httpCode = 504;
    message = 'Network error or timeout. Please check your internet connection and try again.';
  } else if (errorMessage.includes('Invalid JSON response')) {
    type = 'invalid_response';
    retryable = true;
    httpCode = 500;
    message =
      'The AI service returned an invalid response. This may be due to an invalid model name, API rate limiting, or server issues.';
  }

  return { type, message, retryable, httpCode };
}
