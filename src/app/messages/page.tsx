'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  Search, Send, ArrowLeft, MessageCircle,
  CheckCheck, BadgeCheck
} from 'lucide-react';
import { 
  subscribeToConversations, subscribeToMessages, sendMessage,
  markMessagesAsRead, updateLastSeen, markUserOffline, Conversation, Message
} from '@/lib/messages-service';
import { useAuth } from '@/lib/auth-context';
import { createProductLink } from '@/lib/slugs';
import { formatPublicName } from '@/lib/messages';
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Avatar from '@/components/Avatar';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedUsers, setVerifiedUsers] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const hasAutoSelected = useRef(false);

  const [viewportHeight, setViewportHeight] = useState('100vh');

  // Set mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Visual Viewport for iOS keyboard - ONLY on mobile
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport || !isMobile) return;

    const handleResize = () => {
      setViewportHeight(`${window.visualViewport!.height}px`);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    
    // Initial set
    setViewportHeight(`${window.visualViewport.height}px`);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, [isMobile]); // Only run when isMobile changes

  const initialHeight = useRef(0);

  // Detect mobile and save initial height
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && initialHeight.current === 0) {
        initialHeight.current = window.innerHeight;
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // iOS keyboard handling - track offset to move input up
  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return;
    
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleViewportChange = () => {
      // Calculate how much the viewport was pushed up
      const offset = initialHeight.current - viewport.height - viewport.offsetTop;
      setKeyboardHeight(Math.max(0, window.innerHeight - viewport.height));
      
      // Scroll to bottom when keyboard opens
      if (viewport.height < initialHeight.current * 0.8 && messagesContainerRef.current) {
        setTimeout(() => {
          messagesContainerRef.current?.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'auto'
          });
        }, 100);
      }
    };

    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);
    
    return () => {
      viewport.removeEventListener('resize', handleViewportChange);
      viewport.removeEventListener('scroll', handleViewportChange);
    };
  }, [isMobile]);

  // Keep ref updated with conversations
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Check if other users are verified
  useEffect(() => {
    if (!user || conversations.length === 0) return;
    
    const checkVerification = async () => {
      const newVerified: Record<string, boolean> = {};
      
      for (const conv of conversations) {
        const otherUserId = conv.participants.find(p => p !== user.uid);
        if (otherUserId && verifiedUsers[otherUserId] === undefined) {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              newVerified[otherUserId] = userDoc.data()?.verified === true;
            }
          } catch (err) {
            console.error('Error checking verification:', err);
          }
        }
      }
      
      if (Object.keys(newVerified).length > 0) {
        setVerifiedUsers(prev => ({ ...prev, ...newVerified }));
      }
    };
    
    checkVerification();
  }, [conversations, user, verifiedUsers]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=' + encodeURIComponent('/messages'));
    }
  }, [user, authLoading, router]);

  // Auto-select conversation from URL param on mount
  const urlConversationId = searchParams.get('conversation');

  // Subscribe to conversations
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
      
      // Auto-select conversation from URL param ONLY once on first load
      if (!hasAutoSelected.current && urlConversationId) {
        const conv = convs.find(c => c.id === urlConversationId);
        if (conv) {
          setActiveConversation(conv);
          hasAutoSelected.current = true;
        }
      }
    });

    return () => unsubscribe();
  }, [user, urlConversationId]);

  // Subscribe to messages of active conversation
  useEffect(() => {
    if (!activeConversation || !user) return;

    const unsubscribe = subscribeToMessages(activeConversation.id, (msgs) => {
      setMessages(msgs);
      markMessagesAsRead(activeConversation.id, user.uid);
    });

    return () => unsubscribe();
  }, [activeConversation, user]);

  // Update last seen periodically
  useEffect(() => {
    if (!activeConversation || !user) return;
    updateLastSeen(activeConversation.id, user.uid);
    const interval = setInterval(() => {
      updateLastSeen(activeConversation.id, user.uid);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeConversation, user]);

  // Mark user as offline when leaving
  useEffect(() => {
    if (!user) return;
    const handleBeforeUnload = () => {
      conversationsRef.current.forEach(conv => {
        markUserOffline(conv.id, user.uid);
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      conversationsRef.current.forEach(conv => {
        markUserOffline(conv.id, user.uid);
      });
    };
  }, [user]);

  // Scroll to bottom when messages change - smooth scroll
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  }, [messages]);

  // Focus input when conversation opens
  useEffect(() => {
    if (activeConversation) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await sendMessage(activeConversation.id, user.uid, text);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(text);
    }
  };

  const formatTime = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Acum';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}z`;
    return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  };

  const isOtherUserTyping = (conv: Conversation) => {
    if (!user) return false;
    const otherUserId = conv.participants.find(p => p !== user.uid);
    return otherUserId ? conv.typing?.[otherUserId] || false : false;
  };

  const getOtherParticipantName = (conv: Conversation) => {
    if (!user) return '';
    const otherUserId = conv.participants.find(p => p !== user.uid);
    const fullName = otherUserId ? conv.participantNames[otherUserId] || 'Usuario' : '';
    return formatPublicName(fullName);
  };

  const getOtherParticipantAvatar = (conv: Conversation) => {
    if (!user) return '';
    const otherUserId = conv.participants.find(p => p !== user.uid);
    return otherUserId ? conv.participantAvatars[otherUserId] || '' : '';
  };

  const isOtherUserVerified = (conv: Conversation) => {
    if (!user) return false;
    const otherUserId = conv.participants.find(p => p !== user.uid);
    return otherUserId ? verifiedUsers[otherUserId] === true : false;
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const otherName = getOtherParticipantName(conv);
    return otherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.productTitle?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Loading state
  if (authLoading || loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#13C1AC]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#13C1AC] border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Render methods
  const renderConversationsList = (fullWidth = false) => (
    <div className={`bg-white ${fullWidth ? 'min-h-screen' : 'h-full'} flex flex-col`}>
      {/* Header - Different style for mobile vs desktop */}
      {fullWidth ? (
        // Mobile header - elegant dark
        <div className="flex-none px-4 py-3 bg-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/')} 
                className="p-1 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-medium text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Mesaje
              </h1>
            </div>
            <span className="bg-white/15 text-white/90 text-[11px] font-medium px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Caută conversații..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-sm placeholder-white/50 focus:outline-none focus:bg-white/15"
            />
          </div>
        </div>
      ) : (
        // Desktop header - simple white with back button
        <div className="flex-none px-4 py-4 border-b border-gray-200 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Mensajes</h1>
        </div>
      )}

      {/* List container - flex-1 to take remaining space, with internal scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <MessageCircle className="w-10 h-10 text-slate-300 mb-3" />
            <h3 className="font-medium text-gray-700 text-sm mb-1">
              {searchQuery ? 'Fără rezultate' : 'Nu ai mesaje'}
            </h3>
            <p className="text-gray-400 text-xs">
              {searchQuery ? 'Încearcă altă căutare' : 'Contactează vânzătorii din anunțuri'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conv) => {
              const otherName = getOtherParticipantName(conv);
              const otherAvatar = getOtherParticipantAvatar(conv);
              const unreadCount = conv.unreadCount[user.uid] || 0;
              const isTyping = isOtherUserTyping(conv);
              const isActive = activeConversation?.id === conv.id;
              
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConversation(conv);
                    window.history.replaceState(null, '', `/messages?conversation=${conv.id}`);
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all duration-200 ease-out ${
                    isActive 
                      ? 'bg-slate-50 border-l-2 border-l-slate-400' 
                      : 'hover:bg-gray-50 hover:shadow-sm border-l-2 border-l-transparent hover:border-l-slate-200'
                  }`}
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0 relative">
                    {conv.productImage ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-black/5">
                        <Image src={conv.productImage} alt="" width={48} height={48} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <Avatar src={otherAvatar} name={otherName} size="md" />
                    )}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-semibold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: Name + Time */}
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {otherName}
                        </span>
                        {isOtherUserVerified(conv) && (
                          <BadgeCheck className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    {/* Product title */}
                    <p className="text-xs text-slate-500 font-medium truncate mb-0.5">
                      {conv.productTitle || 'Conversație'}
                    </p>

                    {/* Last message */}
                    <p className={`text-xs truncate ${unreadCount > 0 ? 'font-medium text-gray-700' : 'text-gray-400'}`}>
                      {isTyping ? (
                        <span className="text-slate-500 italic flex items-center gap-1">
                          <span className="flex gap-0.5">
                            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </span>
                          Scrie...
                        </span>
                      ) : (
                        conv.lastMessage || 'Începe conversația...'
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Bottom bar - Secure connection - always fixed at bottom on desktop */}
      {!fullWidth && (
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 py-3 px-4 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="w-4 h-4 text-[#13C1AC]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs font-medium">Conexiune securizată</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderChatPanel = () => (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="h-16 flex-shrink-0 bg-white border-b border-gray-200 px-4 flex items-center">
        <div className="flex items-center gap-3 w-full">
          {activeConversation?.productImage ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <Image src={activeConversation.productImage} alt="" width={40} height={40} className="w-full h-full object-cover" />
            </div>
          ) : (
            <Avatar src={getOtherParticipantAvatar(activeConversation!)} name={getOtherParticipantName(activeConversation!)} size="sm" />
          )}

          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">
              {activeConversation?.productTitle || getOtherParticipantName(activeConversation!)}
            </p>
            {activeConversation?.productId && (
              <button 
                onClick={() => router.push(createProductLink({ id: activeConversation.productId!, title: activeConversation.productTitle || '' }))} 
                className="text-xs text-[#13C1AC] font-medium hover:underline"
              >
                Vezi anunțul →
              </button>
            )}
          </div>

          <div className="flex-shrink-0">
            <Avatar src={getOtherParticipantAvatar(activeConversation!)} name={getOtherParticipantName(activeConversation!)} size="sm" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-16 h-16 text-[#13C1AC]/20 mb-3" />
            <p className="text-gray-400">Începe conversația</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMine = msg.senderId === user.uid;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`message-bubble max-w-[70%] px-4 py-2.5 rounded-2xl ${isMine ? 'bg-[#13C1AC] text-white rounded-br-sm' : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'}`}>
                    <p className="text-[15px] whitespace-pre-wrap break-words">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                      <span className={`text-[11px] ${isMine ? 'text-white/70' : 'text-gray-400'}`}>{formatTime(msg.createdAt)}</span>
                      {isMine && <CheckCheck className={`w-3.5 h-3.5 ${msg.read ? 'text-white' : 'text-white/50'}`} />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="h-20 flex-shrink-0 bg-white border-t border-gray-200 px-4 flex items-center">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 w-full">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrie un mesaj..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#13C1AC]"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`flex-shrink-0 p-3 rounded-full transition-colors ${newMessage.trim() ? 'bg-[#13C1AC] text-white hover:bg-[#10a593]' : 'bg-gray-200 text-gray-400'}`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );

  const renderEmptyChatState = () => (
    <div className="h-full flex flex-col items-center justify-center bg-white text-center p-8">
      <div className="w-24 h-24 mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="20" y="25" width="60" height="45" rx="4" fill="#E5F7F5" stroke="#13C1AC" strokeWidth="2"/>
          <path d="M20 35 L50 55 L80 35" fill="none" stroke="#13C1AC" strokeWidth="2" strokeLinecap="round"/>
          <line x1="20" y1="70" x2="35" y2="55" stroke="#13C1AC" strokeWidth="2" strokeLinecap="round"/>
          <line x1="80" y1="70" x2="65" y2="55" stroke="#13C1AC" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Nu ai mesaje încă</h2>
      <p className="text-gray-500 max-w-sm">
        Când cineva îți trimite un mesaj, îl vei vedea aici.
      </p>
    </div>
  );

  // ===================
  // MOBILE VIEW
  // ===================
  if (isMobile) {
    // Show chat if active conversation
    if (activeConversation) {
      return (
        <div 
          ref={containerRef}
          className="fixed inset-0 bg-white z-50 flex flex-col"
        >
          {/* Header - always visible at top */}
          <div className="flex-shrink-0 h-14 bg-white border-b border-gray-200 px-3 flex items-center">
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => {
                  setActiveConversation(null);
                  setMessages([]);
                  window.history.replaceState(null, '', '/messages');
                }}
                className="p-1.5 -ml-1 rounded-full active:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              
              {activeConversation.productImage ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <Image src={activeConversation.productImage} alt="" width={40} height={40} className="w-full h-full object-cover" />
                </div>
              ) : (
                <Avatar src={getOtherParticipantAvatar(activeConversation)} name={getOtherParticipantName(activeConversation)} size="sm" />
              )}

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">
                  {activeConversation.productTitle || getOtherParticipantName(activeConversation)}
                </p>
                {activeConversation.productId && (
                  <button 
                    onClick={() => router.push(createProductLink({ id: activeConversation.productId!, title: activeConversation.productTitle || '' }))} 
                    className="text-xs text-[#13C1AC] font-medium"
                  >
                    Vezi anunțul →
                  </button>
                )}
              </div>

              <Avatar src={getOtherParticipantAvatar(activeConversation)} name={getOtherParticipantName(activeConversation)} size="sm" />
            </div>
          </div>

          {/* Messages area - scrollable */}
          <div 
            ref={messagesContainerRef} 
            className="flex-1 overflow-y-auto bg-gray-50 px-3 py-2"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <MessageCircle className="w-12 h-12 text-[#13C1AC]/20 mb-2" />
                <p className="text-gray-400 text-sm">Începe conversația</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => {
                  const isMine = msg.senderId === user.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`message-bubble max-w-[80%] px-3 py-2 rounded-2xl ${isMine ? 'bg-[#13C1AC] text-white rounded-br-sm' : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'}`}>
                        <p className="text-[15px] whitespace-pre-wrap break-words">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : ''}`}>
                          <span className={`text-[10px] ${isMine ? 'text-white/70' : 'text-gray-400'}`}>{formatTime(msg.createdAt)}</span>
                          {isMine && <CheckCheck className={`w-3 h-3 ${msg.read ? 'text-white' : 'text-white/50'}`} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input - at bottom - same height as secure connection bar */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3 h-[60px] flex items-center">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Scrie un mesaj..."
                enterKeyHint="send"
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-gray-900 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#13C1AC]"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className={`p-2.5 rounded-full transition-colors ${newMessage.trim() ? 'bg-[#13C1AC] text-white' : 'bg-gray-200 text-gray-400'}`}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      );
    }

    // Show conversation list
    return renderConversationsList(true);
  }

  // ===================
  // DESKTOP VIEW - Split panel
  // ===================
  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 md:px-8">
      <div className="max-w-6xl mx-auto h-[calc(100vh-48px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-full flex">
          {/* Left panel - Conversations list - fixed width */}
          <div className="w-[400px] h-full flex-shrink-0 border-r border-gray-200">
            {renderConversationsList()}
          </div>
          
          {/* Right panel - Chat or empty state - takes remaining space */}
          <div className="flex-1 h-full overflow-hidden">
            {activeConversation ? renderChatPanel() : renderEmptyChatState()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#13C1AC] border-t-transparent rounded-full"></div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
