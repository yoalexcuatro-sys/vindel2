'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Search, Send, ArrowLeft, MoreVertical, Trash2, MessageCircle,
  CheckCheck, Circle, Smile, X
} from 'lucide-react';
import { 
  getConversations, getMessages, saveMessage, markConversationAsRead,
  deleteConversation, Conversation, Message
} from '@/lib/messages';
import { currentUser } from '@/data/user';

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar conversaciones
  useEffect(() => {
    const loadConversations = () => {
      const convs = getConversations();
      setConversations(convs);
      setLoading(false);
    };
    
    loadConversations();
    
    // Actualizar cada 2 segundos
    const interval = setInterval(loadConversations, 2000);
    return () => clearInterval(interval);
  }, []);

  // Cargar mensajes de conversación activa
  useEffect(() => {
    if (!activeConversation) return;
    
    const loadMessages = () => {
      const msgs = getMessages(activeConversation.id);
      setMessages(msgs);
      markConversationAsRead(activeConversation.id);
    };
    
    loadMessages();
    
    // Actualizar cada segundo
    const interval = setInterval(loadMessages, 1000);
    return () => clearInterval(interval);
  }, [activeConversation]);

  // Scroll automático
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

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen) setMenuOpen(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    saveMessage(message);
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setTimeout(() => scrollToBottom(true), 100);
    
    // Actualizar lista de conversaciones
    setConversations(getConversations());
  };

  const handleDeleteConversation = () => {
    if (!conversationToDelete) return;
    
    deleteConversation(conversationToDelete);
    if (activeConversation?.id === conversationToDelete) {
      setActiveConversation(null);
    }
    setConversations(getConversations());
    setShowDeleteConfirm(false);
    setConversationToDelete(null);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
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

  // Filtrar conversaciones
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    return conv.productTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
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

  return (
    <div className="h-[calc(100vh-140px)] bg-gray-50">
      <div className="max-w-7xl mx-auto h-full p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 h-full overflow-hidden flex">
          
          {/* Panel izquierdo - Lista de conversaciones */}
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
              
              {/* Búsqueda */}
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

            {/* Lista de conversaciones */}
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
                    
                    return (
                      <div key={conv.id} className="relative group">
                        <button
                          onClick={() => setActiveConversation(conv)}
                          className={`w-full p-4 text-left transition-all duration-200 hover:bg-gray-50 ${
                            isActive ? 'bg-[#13C1AC]/5 border-l-4 border-[#13C1AC]' : 'border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Imagen del producto */}
                            <div className="relative flex-shrink-0">
                              {conv.productImage ? (
                                <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white shadow-md">
                                  <Image 
                                    src={conv.productImage} 
                                    alt="" 
                                    width={56} 
                                    height={56} 
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#13C1AC] to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                  {conv.productTitle.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className={`font-semibold truncate ${isActive ? 'text-[#13C1AC]' : 'text-gray-900'}`}>
                                  {conv.productTitle}
                                </h3>
                                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                  {formatTime(conv.lastMessageTime)}
                                </span>
                              </div>
                              
                              <p className="text-xs text-[#13C1AC] font-medium mb-1">
                                {conv.productPrice.toLocaleString()} Lei
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                  {conv.lastMessage || 'Începe conversația...'}
                                </p>
                                {conv.unreadCount > 0 && (
                                  <span className="ml-2 w-5 h-5 bg-[#13C1AC] text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Botón de opciones */}
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

                        {/* Menú desplegable */}
                        {menuOpen === conv.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-4 top-14 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-40">
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setConversationToDelete(conv.id); 
                                  setShowDeleteConfirm(true); 
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

          {/* Panel derecho - Chat */}
          <div className={`flex-1 flex flex-col bg-gray-50 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
            {activeConversation ? (
              <>
                {/* Header del chat */}
                <div className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {/* Imagen del producto */}
                    <div className="relative flex-shrink-0">
                      {activeConversation.productImage ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow-md">
                          <Image 
                            src={activeConversation.productImage} 
                            alt="" 
                            width={40} 
                            height={40} 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#13C1AC] to-emerald-500 flex items-center justify-center text-white font-bold">
                          {activeConversation.productTitle.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-gray-900 truncate">
                        {activeConversation.productTitle}
                      </h2>
                      <p className="text-xs text-[#13C1AC] font-medium flex items-center gap-1">
                        <Circle className="w-2 h-2 fill-current" />
                        {activeConversation.productPrice.toLocaleString()} Lei
                      </p>
                    </div>

                    {/* Botón ver producto */}
                    <button
                      onClick={() => router.push(`/product/${activeConversation.productId}`)}
                      className="hidden sm:block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Vezi anunțul
                    </button>
                  </div>
                </div>

                {/* Área de mensajes */}
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
                        const isMine = message.senderId === currentUser.id;
                        const showAvatar = !isMine && (index === 0 || messages[index - 1]?.senderId === currentUser.id);
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isMine && showAvatar && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end mb-5">
                                {message.senderName?.charAt(0).toUpperCase() || '?'}
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
                                  {message.content}
                                </p>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[10px] text-gray-400">
                                  {formatTime(message.timestamp)}
                                </span>
                                {isMine && (
                                  <CheckCheck className="w-3.5 h-3.5 text-[#13C1AC]" />
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

                {/* Input de mensaje */}
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
              /* Estado vacío */
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

      {/* Modal de confirmación de borrado */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Ștergi conversația?
            </h3>
            <p className="text-gray-500 text-center mb-6">
              Această acțiune nu poate fi anulată. Toate mesajele vor fi șterse.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConversationToDelete(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Anulează
              </button>
              <button
                onClick={handleDeleteConversation}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-lg shadow-red-600/25"
              >
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
