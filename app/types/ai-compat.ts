/**
 * AI SDK v5 Compatibility Layer
 *
 * This file provides type compatibility between the old AI SDK Message format
 * and the new UIMessage format that uses parts instead of content.
 */

import type { UIMessage as AIUIMessage, UIMessagePart, UIDataTypes, UITools } from 'ai';

/**
 * Legacy Message type with content property for backward compatibility
 */
export interface Message extends Omit<AIUIMessage, 'parts'> {
  content: string;
  parts?: UIMessagePart<UIDataTypes, UITools>[];
}

/**
 * Helper function to extract text content from a UIMessage
 */
export function getMessageContent(message: AIUIMessage): string {
  if ('content' in message) {
    return (message as Message).content;
  }

  // Extract text from parts
  if (message.parts) {
    return message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join('\n');
  }

  return '';
}

/**
 * Re-export UIMessage for new code
 */
export type { UIMessage } from 'ai';
