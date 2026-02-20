import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineSparkles, 
  HiOutlineCode, 
  HiOutlineDocumentText,
  HiOutlineLightningBolt,
  HiOutlineChip,
  HiOutlineClipboard,
  HiOutlineCheck,
  HiOutlineRefresh
} from 'react-icons/hi';
import { classNames } from '~/utils/classNames';

interface Suggestion {
  id: string;
  type: 'code' | 'text' | 'action';
  title: string;
  description: string;
  code?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestions: Suggestion[] = [
  {
    id: '1',
    type: 'code',
    title: 'Create API Endpoint',
    description: 'Generate RESTful API endpoint with validation',
    code: `// Create a new API endpoint
app.post('/api/users', async (req, res) => {
  const { email, name } = req.body;
  
  // Validate input
  if (!email || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Create user
  const user = await User.create({ email, name });
  
  res.status(201).json(user);
});`,
  },
  {
    id: '2',
    type: 'code',
    title: 'Add Authentication',
    description: 'Implement JWT authentication middleware',
  },
  {
    id: '3',
    type: 'text',
    title: 'Write Documentation',
    description: 'Generate comprehensive API documentation',
  },
  {
    id: '4',
    type: 'action',
    title: 'Optimize Performance',
    description: 'Analyze and optimize code performance',
  },
];

export function AIPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'll help you with that! Here's my response to: "${input}"\n\nI can generate code, explain concepts, or help optimize your application. What specific aspect would you like me to focus on?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInput(`Help me ${suggestion.title.toLowerCase()}`);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: create hidden textarea and use execCommand
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        }
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2">
            <HiOutlineSparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Powered by advanced AI models</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <HiOutlineRefresh className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                <HiOutlineChip className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                How can I help you today?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                I can help you write code, debug issues, optimize performance, and much more.
              </p>
            </motion.div>

            {/* Quick Actions */}
            <div className="w-full max-w-2xl">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Quick Actions
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left group"
                  >
                    <div className={classNames(
                      'rounded-lg p-2',
                      suggestion.type === 'code' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      suggestion.type === 'text' ? 'bg-green-100 dark:bg-green-900/30' :
                      'bg-orange-100 dark:bg-orange-900/30'
                    )}>
                      {suggestion.type === 'code' && <HiOutlineCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      {suggestion.type === 'text' && <HiOutlineDocumentText className="w-4 h-4 text-green-600 dark:text-green-400" />}
                      {suggestion.type === 'action' && <HiOutlineLightningBolt className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        {suggestion.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {suggestion.description}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={classNames(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={classNames(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={classNames(
                      'text-xs',
                      message.role === 'user' ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {copiedId === message.id ? (
                          <HiOutlineCheck className="w-4 h-4 text-green-500" />
                        ) : (
                          <HiOutlineClipboard className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={classNames(
              'rounded-xl px-4 py-3 font-medium transition-all',
              input.trim() && !isLoading
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            )}
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
