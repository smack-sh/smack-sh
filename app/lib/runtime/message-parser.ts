import type {
  ActionType,
  smackAction,
  smackActionData,
  FileAction,
  ShellAction,
  SupabaseAction,
} from '~/types/actions';
import type { smackArtifactData } from '~/types/artifact';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';

const ARTIFACT_TAG_OPEN = '<smackArtifact';
const ARTIFACT_TAG_CLOSE = '</smackArtifact>';
const ARTIFACT_ACTION_TAG_OPEN = '<smackAction';
const ARTIFACT_ACTION_TAG_CLOSE = '</smackAction>';
const smack_QUICK_ACTIONS_OPEN = '<smack-quick-actions>';
const smack_QUICK_ACTIONS_CLOSE = '</smack-quick-actions>';

const logger = createScopedLogger('MessageParser');

export interface ArtifactCallbackData extends smackArtifactData {
  messageId: string;
  artifactId?: string;
}

export interface ActionCallbackData {
  artifactId: string;
  messageId: string;
  actionId: string;
  action: smackAction;
}

export type ArtifactCallback = (data: ArtifactCallbackData) => void;
export type ActionCallback = (data: ActionCallbackData) => void;

export interface ParserCallbacks {
  onArtifactOpen?: ArtifactCallback;
  onArtifactClose?: ArtifactCallback;
  onActionOpen?: ActionCallback;
  onActionStream?: ActionCallback;
  onActionClose?: ActionCallback;
}

interface ElementFactoryProps {
  messageId: string;
  artifactId?: string;
}

type ElementFactory = (props: ElementFactoryProps) => string;

export interface StreamingMessageParserOptions {
  callbacks?: ParserCallbacks;
  artifactElement?: ElementFactory;
}

interface MessageState {
  position: number;
  insideArtifact: boolean;
  insideAction: boolean;
  artifactCounter: number;
  currentArtifact?: smackArtifactData;
  currentAction: smackActionData;
  actionId: number;
}

function cleanoutMarkdownSyntax(content: string) {
  const codeBlockRegex = /^\s*```\w*\n([\s\S]*?)\n\s*```\s*$/;
  const match = content.match(codeBlockRegex);

  // console.log('matching', !!match, content);

  if (match) {
    return match[1]; // Remove common leading 4-space indent
  } else {
    return content;
  }
}

function cleanEscapedTags(content: string) {
  return content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
export class StreamingMessageParser {
  #messages = new Map<string, MessageState>();
  #artifactCounter = 0;
  private readonly MAX_CONTENT_LENGTH = 1024 * 1024; // 1MB limit for action content

  constructor(private _options: StreamingMessageParserOptions = {}) {}

  parse(messageId: string, input: string) {
    let state = this.#messages.get(messageId);

    if (!state) {
      state = {
        position: 0,
        insideAction: false,
        insideArtifact: false,
        artifactCounter: 0,
        currentAction: { content: '' },
        actionId: 0,
        buffer: '',
      };
      this.#messages.set(messageId, state);
    }

    const chunk = state.buffer + input.slice(state.position);
    state.buffer = '';

    let output = '';
    let i = 0;

    while (i < chunk.length) {
      const remainingInput = chunk.slice(i);
      if (state.insideArtifact) {
        const currentArtifact = state.currentArtifact;

        if (currentArtifact === undefined) {
          unreachable('Artifact not initialized');
        }

        if (state.insideAction) {
          const closeIndex = remainingInput.indexOf(ARTIFACT_ACTION_TAG_CLOSE);
          const currentAction = state.currentAction;

          if (closeIndex !== -1) {
            const contentChunk = remainingInput.slice(0, closeIndex);
            currentAction.content += contentChunk;

            if (currentAction.content.length > this.MAX_CONTENT_LENGTH) {
              logger.warn('Action content exceeds max length, truncating.');
              currentAction.content = currentAction.content.slice(0, this.MAX_CONTENT_LENGTH);
            }

            let content = currentAction.content.trim();

            try {
              if ('type' in currentAction && currentAction.type === 'file') {
                if (!currentAction.filePath.endsWith('.md')) {
                  content = cleanoutMarkdownSyntax(content);
                  content = cleanEscapedTags(content);
                }
                content += '\n';
              } else {
                // Try to parse as JSON for other action types
                JSON.parse(content);
              }
            } catch (e) {
              // Not JSON, which is fine for many action types.
            }

            currentAction.content = content;

            this._options.callbacks?.onActionClose?.({
              artifactId: currentArtifact.id,
              messageId,
              actionId: String(state.actionId - 1),
              action: currentAction as smackAction,
            });

            state.insideAction = false;
            state.currentAction = { content: '' };
            i += closeIndex + ARTIFACT_ACTION_TAG_CLOSE.length;
          } else {
            currentAction.content += remainingInput;
            if (currentAction.content.length > this.MAX_CONTENT_LENGTH) {
              logger.warn('Action content stream exceeds max length, marking as partial.');
              currentAction.partial = true;
              currentAction.content = currentAction.content.slice(0, this.MAX_CONTENT_LENGTH);
              // Don't buffer, just end the action
              this._options.callbacks?.onActionClose?.({
                artifactId: currentArtifact.id,
                messageId,
                actionId: String(state.actionId - 1),
                action: currentAction as smackAction,
              });
              state.insideAction = false;
              state.currentAction = { content: '' };
            } else {
              this._options.callbacks?.onActionStream?.({
                artifactId: currentArtifact.id,
                messageId,
                actionId: String(state.actionId - 1),
                action: { ...currentAction, content: remainingInput } as smackAction,
              });
              state.buffer = chunk.slice(i);
            }
            break;
          }
        } else {
          const actionOpenIndex = remainingInput.indexOf(ARTIFACT_ACTION_TAG_OPEN);
          const artifactCloseIndex = remainingInput.indexOf(ARTIFACT_TAG_CLOSE);

          if (actionOpenIndex !== -1 && (artifactCloseIndex === -1 || actionOpenIndex < artifactCloseIndex)) {
            const actionEndIndex = remainingInput.indexOf('>', actionOpenIndex);

            if (actionEndIndex !== -1) {
              state.insideAction = true;
              try {
                state.currentAction = this.#parseActionTag(remainingInput, actionOpenIndex, actionEndIndex);
                this._options.callbacks?.onActionOpen?.({
                  artifactId: currentArtifact.id,
                  messageId,
                  actionId: String(state.actionId++),
                  action: state.currentAction as smackAction,
                });
                i += actionEndIndex + 1;
              } catch (error) {
                logger.error('Failed to parse action tag:', error);
                state.insideAction = false;
                i += actionOpenIndex + ARTIFACT_ACTION_TAG_OPEN.length;
              }
            } else {
              state.buffer = chunk.slice(i);
              break;
            }
          } else if (artifactCloseIndex !== -1) {
            this._options.callbacks?.onArtifactClose?.({
              messageId,
              artifactId: currentArtifact.id,
              ...currentArtifact,
            });
            state.insideArtifact = false;
            state.currentArtifact = undefined;
            i += artifactCloseIndex + ARTIFACT_TAG_CLOSE.length;
          } else {
            state.buffer = chunk.slice(i);
            break;
          }
        }
      } else if (remainingInput.startsWith(ARTIFACT_TAG_OPEN)) {
        const openTagEnd = remainingInput.indexOf('>');
        if (openTagEnd !== -1) {
          const artifactTag = remainingInput.slice(0, openTagEnd + 1);
          const artifactTitle = this.#extractAttribute(artifactTag, 'title') as string;
          const type = this.#extractAttribute(artifactTag, 'type') as string;
          const artifactId = `${messageId}-${state.artifactCounter++}`;

          if (!artifactTitle || !artifactId) {
            logger.warn('Artifact title or id missing', { artifactTag });
            output += remainingInput[0];
            i++;
            continue;
          }

          state.insideArtifact = true;
          const currentArtifact = { id: artifactId, title: artifactTitle, type } satisfies smackArtifactData;
          state.currentArtifact = currentArtifact;

          this._options.callbacks?.onArtifactOpen?.({
            messageId,
            artifactId: currentArtifact.id,
            ...currentArtifact,
          });

          const artifactFactory = this._options.artifactElement ?? createArtifactElement;
          output += artifactFactory({ messageId, artifactId });
          i += openTagEnd + 1;
        } else {
          state.buffer = chunk.slice(i);
          break;
        }
      } else {
        const nextTagIndex = remainingInput.indexOf('<');
        if (nextTagIndex === -1) {
          output += remainingInput;
          i += remainingInput.length;
        } else {
          output += remainingInput.slice(0, nextTagIndex);
          i += nextTagIndex;
        }
      }
    }

    state.position = input.length;
    return output;
  }

  reset() {
    this.#messages.clear();
  }

  #parseActionTag(input: string, actionOpenIndex: number, actionEndIndex: number) {
    const actionTag = input.slice(actionOpenIndex, actionEndIndex + 1);
    const actionType = this.#extractAttribute(actionTag, 'type') as ActionType;

    if (!actionType) {
      throw new Error('Action type is missing');
    }

    const actionAttributes: Partial<smackAction> = {
      type: actionType,
      content: '',
    };

    try {
      if (actionType === 'supabase') {
        const operation = this.#extractAttribute(actionTag, 'operation');
        if (!operation || !['migration', 'query'].includes(operation)) {
          throw new Error(`Invalid Supabase operation: ${operation}`);
        }
        (actionAttributes as SupabaseAction).operation = operation as 'migration' | 'query';
        if (operation === 'migration') {
          const filePath = this.#extractAttribute(actionTag, 'filePath');
          if (!filePath) throw new Error('Migration requires a filePath');
          (actionAttributes as SupabaseAction).filePath = filePath;
        }
      } else if (actionType === 'file') {
        const filePath = this.#extractAttribute(actionTag, 'filePath') as string;
        if (!filePath) logger.debug('File path not specified');
        (actionAttributes as FileAction).filePath = filePath;
      } else if (!['shell', 'start'].includes(actionType)) {
        logger.warn(`Unknown action type '${actionType}'`);
      }
    } catch (error) {
      logger.error('Error parsing action attributes:', { actionTag, error });
      throw error; // Re-throw to be caught by the caller
    }

    return actionAttributes as FileAction | ShellAction;
  }

  #extractAttribute(tag: string, attributeName: string): string | undefined {
    const match = tag.match(new RegExp(`${attributeName}="([^"]*)"`, 'i'));
    return match ? match[1] : undefined;
  }
}

const createArtifactElement: ElementFactory = (props) => {
  const elementProps = [
    'class="__smackArtifact__"',
    ...Object.entries(props).map(([key, value]) => {
      return `data-${camelToDashCase(key)}=${JSON.stringify(value)}`;
    }),
  ];

  return `<div ${elementProps.join(' ')}></div>`;
};

function camelToDashCase(input: string) {
  return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function createQuickActionElement(props: Record<string, string>, label: string) {
  const elementProps = [
    'class="__smackQuickAction__"',
    'data-smack-quick-action="true"',
    ...Object.entries(props).map(([key, value]) => `data-${camelToDashCase(key)}=${JSON.stringify(value)}`),
  ];

  return `<button ${elementProps.join(' ')}>${label}</button>`;
}

function createQuickActionGroup(buttons: string[]) {
  return `<div class=\"__smackQuickAction__\" data-smack-quick-action=\"true\">${buttons.join('')}</div>`;
}
