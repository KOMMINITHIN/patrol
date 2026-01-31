import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { 
  getGlobalMessages, 
  sendGlobalMessage, 
  subscribeToGlobalChat,
  getActiveUsersCount,
  getTotalMessageCount
} from '../../services/chat';
import { formatTimeAgo } from '../../utils/helpers';

const ChatPanel = ({ isOpen, onClose }) => {
  const { user, profile, isAuthenticated, signIn } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState({ totalMessages: 0, activeUsers: 0 });
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const subscriptionRef = useRef(null);

  // Animate panel on open/close
  useEffect(() => {
    if (panelRef.current) {
      if (isOpen) {
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, x: -50 },
          { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
        );
      }
    }
  }, [isOpen]);

  // Load messages and subscribe to updates
  useEffect(() => {
    if (!isOpen) return;

    // Load messages immediately (may use cache)
    loadMessages();
    
    // Load stats in background (non-blocking)
    loadStats();

    // Subscribe to realtime updates
    subscriptionRef.current = subscribeToGlobalChat((payload) => {
      if (payload.eventType === 'INSERT') {
        setMessages((prev) => [...prev, payload.new]);
        scrollToBottom();
      } else if (payload.eventType === 'DELETE') {
        setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getGlobalMessages(50);
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Unable to load messages. Try refreshing.');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    // Load stats in background without blocking UI
    Promise.all([
      getTotalMessageCount().catch(() => 0),
      getActiveUsersCount().catch(() => 0)
    ]).then(([totalMessages, activeUsers]) => {
      setStats({ totalMessages, activeUsers });
    });
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to send messages');
      signIn();
      return;
    }

    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await sendGlobalMessage(
        user.id, 
        newMessage, 
        profile?.display_name || 'Anonymous'
      );
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="chat-panel-container flex flex-col"
    >
      {/* Header */}
      <div className="chat-header p-4 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Community Chat</h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className="flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  {stats.activeUsers} online
                </span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500">{stats.totalMessages} messages</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors mt-0.5"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="border-b border-gray-100 mb-4"></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-3">
              <div className="spinner"></div>
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 mb-4 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-center font-medium text-gray-700 mb-2">Community Chat</p>
            <p className="text-center text-sm text-gray-500 mb-4">Chat feature is coming soon!<br />Stay tuned for real-time discussions.</p>
            <button 
              onClick={loadMessages}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-center font-medium text-gray-700">No messages yet</p>
            <p className="text-center text-sm text-gray-500">Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = user?.id === message.user_id;
            const displayName = message.profiles?.display_name || message.username || 'Anonymous';
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
              >
                <div className={`${isOwn ? 'text-right' : 'text-left'}`} style={{ maxWidth: '80%' }}>
                  {/* Username for others */}
                  {!isOwn && (
                    <div className="flex items-center gap-2 mb-1 ml-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-600">{displayName}</span>
                    </div>
                  )}
                  
                  {/* Message bubble */}
                  <div className={`${isOwn ? 'chat-bubble-own' : 'chat-bubble-other'} chat-bubble`}>
                    <span className="text-sm">{message.content}</span>
                  </div>
                  
                  {/* Time */}
                  <div className={`mt-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
                    <span className="text-xs text-gray-400">{formatMessageTime(message.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed at bottom */}
      <div className="chat-input-container p-3 border-t border-gray-200/50">
        {!isAuthenticated ? (
          <button
            onClick={signIn}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-2xl hover:shadow-lg hover:shadow-blue-500/25 transition-all active:scale-[0.98]"
          >
            Sign in to chat
          </button>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-gray-100 md:bg-gray-50 border-0 rounded-full py-3 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder-gray-400"
                maxLength={500}
                disabled={isSending}
              />
            </div>
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="w-11 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none active:scale-95 flex-shrink-0"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
