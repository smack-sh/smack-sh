import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useAnimate } from 'framer-motion';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { cssTransition, toast, ToastContainer } from 'react-toastify';
import { useMessageParser, usePromptEnhancer, useShortcuts } from '~/lib/hooks';
import { description, useChatHistory } from '~/lib/persistence';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROMPT_COOKIE_KEY, PROVIDER_LIST } from '~/utils/constants';
import { cubicEasingFn } from '~/utils/easings';
import { createScopedLogger, renderLogger } from '~/utils/logger';
import { BaseChat } from './BaseChat';
import Cookies from 'js-cookie';
import { debounce } from '~/utils/debounce';
import { useSettings } from '~/lib/hooks/useSettings';
import type { ProviderInfo } from '~/types/model';
import { useSearchParams } from '@remix-run/react';
import { createSampler } from '~/utils/sampler';
import { getTemplates, selectStarterTemplate } from '~/utils/selectStarterTemplate';
import { logStore } from '~/lib/stores/logs';
import { streamingState } from '~/lib/stores/streaming';
import { filesToArtifacts } from '~/utils/fileUtils';
import { supabaseConnection } from '~/lib/stores/supabase';
import { defaultDesignScheme, type DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import type { TextUIPart, FileUIPart, Attachment } from '@ai-sdk/ui-utils';
import { useMCPStore } from '~/lib/stores/mcp';
import type { LlmErrorAlertType } from '~/types/actions';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

const logger = createScopedLogger('Chat');

export function Chat() {
  renderLogger.trace('Chat');

  const { ready, initialMessages, storeMessageHistory, importChat, exportChat } = useChatHistory();
  const title = useStore(description);
  useEffect(() => {
    workbenchStore.setReloadedMessages(initialMessages.map((m) => m.id));
  }, [initialMessages]);

  return (
    <>
      {ready && (
        <ChatImpl
          description={title}
          initialMessages={initialMessages}
          exportChat={exportChat}
          storeMessageHistory={storeMessageHistory}
          importChat={importChat}
        />
      )}
      <ToastContainer
        closeButton={({ closeToast }) => {
          return (
            <button className="Toastify__close-button" onClick={closeToast}>
              <div className="i-ph:x text-lg" />
            </button>
          );
        }}
        icon={({ type }) => {
          /**
           * @todo Handle more types if we need them. This may require extra color palettes.
           */
          switch (type) {
            case 'success': {
              return <div className="i-ph:check-bold text-smack-elements-icon-success text-2xl" />;
            }
            case 'error': {
              return <div className="i-ph:warning-circle-bold text-smack-elements-icon-error text-2xl" />;
            }
          }

          return undefined;
        }}
        position="bottom-right"
        pauseOnFocusLoss
        transition={toastAnimation}
        autoClose={3000}
      />
    </>
  );
}

const processSampledMessages = createSampler(
  (options: {
    messages: Message[];
    initialMessages: Message[];
    isLoading: boolean;
    parseMessages: (messages: Message[], isLoading: boolean) => void;
    storeMessageHistory: (messages: Message[]) => Promise<void>;
  }) => {
    const { messages, initialMessages, isLoading, parseMessages, storeMessageHistory } = options;
    parseMessages(messages, isLoading);

    if (messages.length > initialMessages.length) {
      storeMessageHistory(messages).catch((error) => toast.error(error.message));
    }
  },
  50,
);

interface ChatProps {
  initialMessages: Message[];
  storeMessageHistory: (messages: Message[]) => Promise<void>;
  importChat: (description: string, messages: Message[]) => Promise<void>;
  exportChat: () => void;
  description?: string;
}

export const ChatImpl = memo(
  ({ description, initialMessages, storeMessageHistory, importChat, exportChat }: ChatProps) => {
    useShortcuts();

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [imageDataList, setImageDataList] = useState<string[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [fakeLoading, setFakeLoading] = useState(false);
    const files = useStore(workbenchStore.files);
    const [designScheme, setDesignScheme] = useState<DesignScheme>(defaultDesignScheme);
    const actionAlert = useStore(workbenchStore.alert);
    const deployAlert = useStore(workbenchStore.deployAlert);
    const supabaseConn = useStore(supabaseConnection);
    const selectedProject = supabaseConn.stats?.projects?.find(
      (project) => project.id === supabaseConn.selectedProjectId,
    );
    const supabaseAlert = useStore(workbenchStore.supabaseAlert);
    const { activeProviders, promptId, autoSelectTemplate, contextOptimizationEnabled } = useSettings();
    const [llmErrorAlert, setLlmErrorAlert] = useState<LlmErrorAlertType | undefined>(undefined);
    const [model, setModel] = useState(DEFAULT_MODEL);
    const [provider, setProvider] = useState(DEFAULT_PROVIDER as ProviderInfo);
    const { showChat } = useStore(chatStore);
    const [animationScope, animate] = useAnimate();
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [chatMode, setChatMode] = useState<'discuss' | 'build'>('build');
    const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
    const mcpSettings = useMCPStore((state) => state.settings);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;
    const STREAM_TIMEOUT = 30000; // 30 seconds
    const [isLastMessagePartial, setIsLastMessagePartial] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'stable' | 'unstable' | 'recovering'>('stable');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [showAuthPrompt, setShowAuthPrompt] = useState<boolean>(false);

    const {
      messages,
      isLoading,
      input,
      handleInputChange,
      setInput,
      stop,
      append,
      setMessages,
      reload,
      error,
      data: chatData,
      setData,
      addToolResult,
    } = useChat({
      api: '/api/chat',
      body: {
        apiKeys,
        files,
        promptId,
        contextOptimization: contextOptimizationEnabled,
        chatMode,
        designScheme,
        supabase: {
          isConnected: supabaseConn.isConnected,
          hasSelectedProject: !!selectedProject,
          credentials: {
            supabaseUrl: supabaseConn?.credentials?.supabaseUrl,
            anonKey: supabaseConn?.credentials?.anonKey,
          },
        },
        maxLLMSteps: mcpSettings.maxLLMSteps,
      },
      sendExtraMessageFields: true,
      onError: (e) => {
        setFakeLoading(false);
        handleError(e, 'chat');
      },
      onFinish: (message, response) => {
        const usage = response.usage;
        setData(undefined);
        setRetryCount(0);
        setIsLastMessagePartial(false);
        setConnectionStatus('stable');

        if (usage) {
          console.log('Token usage:', usage);
          logStore.logProvider('Chat response completed', {
            component: 'Chat',
            action: 'response',
            model,
            provider: provider.name,
            usage,
            messageLength: message.content.length,
          });
        }

        logger.debug('Finished streaming');
      },
      initialMessages,
      initialInput: Cookies.get(PROMPT_COOKIE_KEY) || '',
    });

    useEffect(() => {
      let timeoutId: NodeJS.Timeout | null = null;
      if (isLoading) {
        setConnectionStatus('stable');
        timeoutId = setTimeout(() => {
          setConnectionStatus('unstable');
          handleError(new Error('Stream timed out'), 'chat');
        }, STREAM_TIMEOUT);
      } else {
        setConnectionStatus('stable');
      }
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }, [isLoading, messages]);

    useEffect(() => {
      let active = true;

      const loadAuthStatus = async () => {
        try {
          const response = await fetch('/api/auth/status');
          const data = (await response.json()) as { authenticated?: boolean };

          if (active) {
            setIsAuthenticated(Boolean(data.authenticated));
          }
        } catch (error) {
          console.error('Failed to load auth status:', error);

          if (active) {
            setIsAuthenticated(false);
          }
        }
      };

      loadAuthStatus();

      return () => {
        active = false;
      };
    }, []);

    const handleError = useCallback(
      (error: any, context: 'chat' | 'template' | 'llmcall' = 'chat') => {
        logger.error(`${context} request failed`, error);
        stop();
        setFakeLoading(false);

        let errorInfo = {
          message: 'An unexpected error occurred',
          isRetryable: true,
          statusCode: 500,
          provider: provider.name,
          type: 'unknown' as const,
        };

        try {
          const parsed = JSON.parse(error.message);
          errorInfo = { ...errorInfo, ...parsed };
        } catch {
          errorInfo.message = error.message;
        }

        if (errorInfo.isRetryable && retryCount < MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * 1000;
          setConnectionStatus('recovering');
          toast.info(`Connection issue. Retrying in ${delay / 1000}s... (Attempt ${retryCount + 1})`);
          setTimeout(() => {
            setRetryCount(retryCount + 1);
            reload();
          }, delay);
          return;
        }

        let errorType: LlmErrorAlertType['errorType'] = 'unknown';
        let title = 'Request Failed';

        if (errorInfo.statusCode === 401 || errorInfo.message.toLowerCase().includes('api key')) {
          errorType = 'authentication';
          title = 'Authentication Error';
        } else if (errorInfo.statusCode === 429 || errorInfo.message.toLowerCase().includes('rate limit')) {
          errorType = 'rate_limit';
          title = 'Rate Limit Exceeded';
        } else if (errorInfo.message.toLowerCase().includes('quota')) {
          errorType = 'quota';
          title = 'Quota Exceeded';
        } else if (errorInfo.statusCode >= 500) {
          errorType = 'network';
          title = 'Server Error';
        }

        logStore.logError(`${context} request failed`, error, {
          component: 'Chat',
          action: 'request',
          error: errorInfo.message,
          context,
          retryable: errorInfo.isRetryable,
          errorType,
          provider: provider.name,
        });

        setLlmErrorAlert({
          type: 'error',
          title,
          description: errorInfo.message,
          provider: provider.name,
          errorType,
          retryable: errorInfo.isRetryable,
        });
        setData([]);
        if (messages[messages.length - 1]?.role === 'assistant') {
          setIsLastMessagePartial(true);
        }
        setRetryCount(0);
      },
      [provider.name, stop, retryCount, messages],
    );

    const clearApiErrorAlert = useCallback(() => {
      setLlmErrorAlert(undefined);
    }, []);

    useEffect(() => {
      const prompt = searchParams.get('prompt');
      if (prompt) {
        setSearchParams({});
        runAnimation();
        append({
          role: 'user',
          content: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${prompt}`,
        });
      }
    }, [model, provider, searchParams, append, setSearchParams]);

    const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();
    const { parsedMessages, parseMessages } = useMessageParser();

    useEffect(() => {
      chatStore.setKey('started', initialMessages.length > 0);
    }, [initialMessages]);

    useEffect(() => {
      processSampledMessages({
        messages,
        initialMessages,
        isLoading,
        parseMessages,
        storeMessageHistory,
      });
    }, [messages, isLoading, parseMessages, storeMessageHistory, initialMessages]);

    const runAnimation = async () => {
      if (chatStarted) return;
      await Promise.all([
        animate('#examples', { opacity: 0, display: 'none' }, { duration: 0.1 }),
        animate('#intro', { opacity: 0, flex: 1 }, { duration: 0.2, ease: cubicEasingFn }),
      ]);
      chatStore.setKey('started', true);
      setChatStarted(true);
    };

    const sendMessage = async (_event: React.UIEvent, messageInput?: string) => {
      const messageContent = messageInput || input;
      const hasText = Boolean(messageContent?.trim());
      const hasImages = uploadedFiles.length > 0;

      if (!hasText && !hasImages) {
        return;
      }

      if (isLoading) {
        stop();
        return;
      }

      if (!isAuthenticated) {
        setShowAuthPrompt(true);
        return;
      }

      await runAnimation();
      clearApiErrorAlert();
      resetEnhancer();

      await append({
        role: 'user',
        content: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${messageContent || ''}`,
      });

      setInput('');
      setUploadedFiles([]);
      setImageDataList([]);
      Cookies.remove(PROMPT_COOKIE_KEY);
    };

    return (
      <BaseChat
        ref={animationScope}
        textareaRef={textareaRef}
        input={input}
        showChat={showChat}
        chatStarted={chatStarted}
        isStreaming={isLoading || fakeLoading}
        onStreamingChange={(streaming) => streamingState.set(streaming)}
        enhancingPrompt={enhancingPrompt}
        promptEnhanced={promptEnhanced}
        sendMessage={sendMessage}
        model={model}
        setModel={(newModel) => {
          setModel(newModel);
        }}
        provider={provider}
        setProvider={(newProvider) => {
          setProvider(newProvider);
        }}
        providerList={[DEFAULT_PROVIDER as ProviderInfo]}
        handleInputChange={handleInputChange}
        handleStop={stop}
        description={description}
        importChat={importChat}
        exportChat={exportChat}
        messages={messages.map((message, i) => {
          const isLast = i === messages.length - 1;
          if (isLast && isLastMessagePartial && message.role === 'assistant') {
            return {
              ...message,
              content: parsedMessages[i] || '',
              annotations: [...(message.annotations || []), { type: 'partial' }],
            };
          }
          if (message.role === 'user') return message;
          return { ...message, content: parsedMessages[i] || '' };
        })}
        enhancePrompt={() =>
          enhancePrompt(input, setInput, model, provider, apiKeys)
        }
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
        imageDataList={imageDataList}
        setImageDataList={setImageDataList}
        actionAlert={actionAlert}
        clearAlert={() => workbenchStore.clearAlert()}
        supabaseAlert={supabaseAlert}
        clearSupabaseAlert={() => workbenchStore.clearSupabaseAlert()}
        deployAlert={deployAlert}
        clearDeployAlert={() => workbenchStore.clearDeployAlert()}
        llmErrorAlert={llmErrorAlert}
        clearLlmErrorAlert={clearApiErrorAlert}
        onRetry={() => {
          clearApiErrorAlert();
          reload();
        }}
        data={chatData}
        chatMode={chatMode}
        setChatMode={setChatMode}
        append={append}
        designScheme={designScheme}
        setDesignScheme={setDesignScheme}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
        addToolResult={addToolResult}
        showAuthPrompt={showAuthPrompt}
        closeAuthPrompt={() => setShowAuthPrompt(false)}
      />
    );
  },
);
