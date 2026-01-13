'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  Search, Send, ArrowLeft, MoreVertical, Trash2, MessageCircle,
  CheckCheck, Circle, Smile
} from 'lucide-react';
import { 
  subscribeToConversations, subscribeToMessages, sendMessage,
  markMessagesAsRead, updateLastSeen, updateTypingStatus, markUserOffline, Conversation, Message
} from '@/lib/messages-service';
import { useAuth } from '@/lib/auth-context';
import { createProductLink } from '@/lib/slugs';
import { Timestamp } from 'firebase/firestore';
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
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationsRef = useRef<Conversation[]>([]);

  // Keep ref updated with conversations
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=' + encodeURIComponent('/messages'));
    }
  }, [user, authLoading, router]);

  // Subscribe to conversations and update online status for all
  useEffect(() => {
    if (!user) return;

    let isFirstLoad = true;

    const unsubscribe = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
      
      // Only update lastSeen once on initial load, not on every update
      if (isFirstLoad) {
        isFirstLoad = false;
        convs.forEach(conv => {
          updateLastSeen(conv.id, user.uid);
        });
      }
      
      // Auto-select conversation from URL param
      const conversationId = searchParams.get('conversation');
      if (conversationId && !activeConversation) {
        const conv = convs.find(c => c.id === conversationId);
        if (conv) {
          setActiveConversation(conv);
        }
      }
    });

    return () => unsubscribe();
  }, [user, searchParams, activeConversation]);

  // Subscribe to messages of active conversation
  useEffect(() => {
    if (!activeConversation || !user) return;

    const unsubscribe = subscribeToMessages(activeConversation.id, (msgs) => {
      setMessages(msgs);
      // Mark as read
      markMessagesAsRead(activeConversation.id, user.uid);
    });

    return () => unsubscribe();
  }, [activeConversation, user]);

  // Update last seen periodically when viewing a conversation
  useEffect(() => {
    if (!activeConversation || !user) return;

    // Update immediately
    updateLastSeen(activeConversation.id, user.uid);

    // Update every 30 seconds while viewing
    const interval = setInterval(() => {
      updateLastSeen(activeConversation.id, user.uid);
    }, 30000);

    return () => clearInterval(interval);
  }, [activeConversation, user]);

  // Mark user as offline when leaving the page
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      // Mark offline for all conversations when closing/leaving page
      conversationsRef.current.forEach(conv => {
        markUserOffline(conv.id, user.uid);
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Mark offline when component unmounts (navigating away)
      conversationsRef.current.forEach(conv => {
        markUserOffline(conv.id, user.uid);
      });
    };
  }, [user]); // Only depend on user, use ref for conversations

  // Scroll to bottom when messages change
  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant'
      });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [messages]);

  useEffect(() => {
    if (activeConversation) {
      setTimeout(() => scrollToBottom(false), 200);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConversation]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen) setMenuOpen(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await sendMessage(activeConversation.id, user.uid, text);
      setTimeout(() => scrollToBottom(true), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(text); // Restore message on error
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

  const formatReadTime = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  };

  // Check if other user is online (seen in last 2 minutes)
  const isOtherUserOnline = (conv: Conversation) => {
    if (!user) return false;
    const otherUserId = conv.participants.find(p => p !== user.uid);
    if (!otherUserId || !conv.lastSeen?.[otherUserId]) return false;
    const lastSeen = conv.lastSeen[otherUserId].toDate();
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    return diffMs < 2 * 60 * 1000; // 2 minutes
  };

  // Check if other user is typing
  const isOtherUserTyping = (conv: Conversation) => {
    if (!user) return false;
    const otherUserId = conv.participants.find(p => p !== user.uid);
    return otherUserId ? conv.typing?.[otherUserId] || false : false;
  };

  // Get other participant's name
  const getOtherParticipantName = (conv: Conversation) => {
    if (!user) return '';
    const otherUserId = conv.participants.find(p => p !== user.uid);
    return otherUserId ? conv.participantNames[otherUserId] || 'Usuario' : '';
  };

  const getOtherParticipantAvatar = (conv: Conversation) => {
    if (!user) return '';
    const otherUserId = conv.participants.find(p => p !== user.uid);
    return otherUserId ? conv.participantAvatars[otherUserId] || '' : '';
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const otherName = getOtherParticipantName(conv);
    return otherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.productTitle?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#13C1AC]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#13C1AC] border-t-transparent animate-spin"></div>
            <MessageCircle className="absolute inset-0 m-auto w-8 h-8 text-[#13C1AC]" />
          </div>
          <p className="text-gray-600 font-medium">Se încarcă mesajele...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-140px)] bg-gray-50">
      <div className="max-w-7xl mx-auto h-full p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 h-full overflow-hidden flex">
          
          {/* Left panel - Conversation list */}
          <div className={`w-full md:w-96 border-r border-gray-100 flex flex-col bg-white ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#13C1AC] to-emerald-500">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" />
                  Mesaje
                </h1>
                <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {conversations.length}
                </span>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  placeholder="Caută conversații..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#13C1AC]/20 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-[#13C1AC]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchQuery ? 'Fără rezultate' : 'Nu ai mesaje'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? 'Încearcă altă căutare' : 'Contactează vânzătorii din anunțuri'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredConversations.map((conv) => {
                    const isActive = activeConversation?.id === conv.id;
                    const otherName = getOtherParticipantName(conv);
                    const otherAvatar = getOtherParticipantAvatar(conv);
                    const unreadCount = conv.unreadCount[user.uid] || 0;
                    const isOnline = isOtherUserOnline(conv);
                    const isTyping = isOtherUserTyping(conv);
                    
                    return (
                      <div key={conv.id} className="relative group">
                        <button
                          onClick={() => {
                            setActiveConversation(conv);
                            // Update URL without navigation
                            window.history.replaceState(null, '', `/messages?conversation=${conv.id}`);
                          }}
                          className={`w-full p-4 text-left transition-all duration-200 hover:bg-gray-50 ${
                            isActive ? 'bg-[#13C1AC]/5 border-l-4 border-[#13C1AC]' : 'border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <Avatar 
                              src={otherAvatar} 
                              name={otherName} 
                              size="lg"
                              showOnlineStatus
                              isOnline={isOnline}
                            />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className={`font-semibold truncate ${isActive ? 'text-[#13C1AC]' : 'text-gray-900'}`}>
                                  {otherName}
                                </h3>
                                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                  {formatTime(conv.lastMessageAt)}
                                </span>
                              </div>
                              
                              {conv.productTitle && (
                                <p className="text-xs text-[#13C1AC] font-medium mb-1 truncate">
                                  {conv.productTitle}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                  {isTyping ? (
                                    <span className="text-[#13C1AC] italic">Scrie...</span>
                                  ) : (
                                    conv.lastMessage || 'Începe conversația...'
                                  )}
                                </p>
                                {unreadCount > 0 && (
                                  <span className="ml-2 w-5 h-5 bg-[#13C1AC] text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Options button */}
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setMenuOpen(menuOpen === conv.id ? null : conv.id);
                          }}
                          className={`absolute top-4 right-4 p-2 rounded-full transition-all ${
                            menuOpen === conv.id ? 'bg-gray-200' : 'opacity-0 group-hover:opacity-100 hover:bg-gray-100'
                          }`}
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>

                        {/* Dropdown menu */}
                        {menuOpen === conv.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-4 top-14 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-40">
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  // TODO: Implement delete conversation
                                  setMenuOpen(null); 
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Șterge conversația
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Chat */}
          <div className={`flex-1 flex flex-col bg-gray-50 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
            {activeConversation ? (
              <>
                {/* Chat header */}
                <div className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setActiveConversation(null);
                        window.history.replaceState(null, '', '/messages');
                      }}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {/* Other user avatar */}
                    <Avatar 
                      src={getOtherParticipantAvatar(activeConversation)} 
                      name={getOtherParticipantName(activeConversation)} 
                      size="md"
                      showOnlineStatus
                      isOnline={isOtherUserOnline(activeConversation)}
                    />

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-gray-900 truncate">
                        {getOtherParticipantName(activeConversation)}
                      </h2>
                      {isOtherUserTyping(activeConversation) ? (
                        <p className="text-xs text-[#13C1AC] font-medium italic">
                          Scrie un mesaj...
                        </p>
                      ) : isOtherUserOnline(activeConversation) ? (
                        <p className="text-xs text-green-500 font-medium">
                          Online
                        </p>
                      ) : activeConversation.productTitle ? (
                        <p className="text-xs text-[#13C1AC] font-medium flex items-center gap-1 truncate">
                          <Circle className="w-2 h-2 fill-current flex-shrink-0" />
                          {activeConversation.productTitle}
                        </p>
                      ) : null}
                    </div>

                    {activeConversation.productId && (
                      <button
                        onClick={() => router.push(createProductLink({ id: activeConversation.productId!, title: activeConversation.productTitle || '' }))}
                        className="hidden sm:block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        Vezi anunțul
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages area */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2313C1AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-[#13C1AC]/20 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-12 h-12 text-[#13C1AC]" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Începe conversația</h3>
                      <p className="text-gray-500 text-sm max-w-xs">
                        Trimite un mesaj pentru a discuta despre acest anunț
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => {
                        const isMine = message.senderId === user.uid;
                        const showAvatar = !isMine && (index === 0 || messages[index - 1]?.senderId === user.uid);
                        const otherAvatar = getOtherParticipantAvatar(activeConversation);
                        const otherName = getOtherParticipantName(activeConversation);
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isMine && showAvatar && (
                              <div className="mr-2 flex-shrink-0 self-end mb-5">
                                <Avatar src={otherAvatar} name={otherName} size="sm" />
                              </div>
                            )}
                            {!isMine && !showAvatar && <div className="w-10 mr-2" />}
                            
                            <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div
                                className={`px-4 py-2.5 shadow-sm ${
                                  isMine
                                    ? 'bg-gradient-to-br from-[#13C1AC] to-emerald-500 text-white rounded-2xl rounded-br-md'
                                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-100'
                                }`}
                              >
                                <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                                  {message.text}
                                </p>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[10px] text-gray-400">
                                  {formatTime(message.createdAt)}
                                </span>
                                {isMine && (
                                  <div className="relative group/check">
                                    <CheckCheck className={`w-3.5 h-3.5 ${message.read ? 'text-[#13C1AC]' : 'text-gray-400'}`} />
                                    {message.read && message.readAt && (
                                      <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/check:opacity-100 transition-opacity pointer-events-none">
                                        Citit la {formatReadTime(message.readAt)}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <div className="bg-white border-t border-gray-100 p-4">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Scrie un mesaj..."
                        className="w-full px-5 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#13C1AC] focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={`p-3 rounded-full transition-all transform ${
                        newMessage.trim()
                          ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-[#13C1AC]/20 to-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <MessageCircle className="w-16 h-16 text-[#13C1AC]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Mesajele tale</h2>
                <p className="text-gray-500 max-w-sm mb-6">
                  Selectează o conversație din listă pentru a discuta cu vânzătorii și cumpărătorii
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Mesaje private și securizate</span>
                </div>
              </div>
            )}
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
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#13C1AC]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#13C1AC] border-t-transparent animate-spin"></div>
            <MessageCircle className="absolute inset-0 m-auto w-8 h-8 text-[#13C1AC]" />
          </div>
          <p className="text-gray-600 font-medium">Se încarcă mesajele...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
