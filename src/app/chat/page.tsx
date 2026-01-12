'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, MoreVertical, Phone, Video, ArrowLeft, MessageCircle, Check, CheckCheck } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  senderId: number;
  text: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  participantId: number;
  participantName: string;
  participantAvatar: string;
  productId?: number;
  productTitle?: string;
  productImage?: string;
  productPrice?: number;
  messages: Message[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

// Usuario actual (simulado)
const currentUser = {
  id: 101,
  name: 'Usuario',
  avatar: '/placeholder-avatar.jpg'
};

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar conversaciones del localStorage
  useEffect(() => {
    const loadConversations = () => {
      const saved = localStorage.getItem('chat_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
      } else {
        // Conversaciones de demo
        const demoConversations: Conversation[] = [
          {
            id: '1',
            participantId: 201,
            participantName: 'Maria García',
            participantAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            productId: 1,
            productTitle: 'iPhone 14 Pro Max',
            productImage: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=100',
            productPrice: 3500,
            messages: [
              { id: '1', senderId: 201, text: 'Bună! Mai este disponibil iPhone-ul?', timestamp: '10:30', read: true },
              { id: '2', senderId: 101, text: 'Da, este încă disponibil!', timestamp: '10:32', read: true },
              { id: '3', senderId: 201, text: 'Perfect! Acceptați 3200 Lei?', timestamp: '10:35', read: false },
            ],
            lastMessage: 'Perfect! Acceptați 3200 Lei?',
            lastMessageTime: '10:35',
            unreadCount: 1
          },
          {
            id: '2',
            participantId: 202,
            participantName: 'Alexandru Pop',
            participantAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            productId: 2,
            productTitle: 'MacBook Air M1',
            productImage: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=100',
            productPrice: 4500,
            messages: [
              { id: '1', senderId: 202, text: 'Salut! Cât de vechi este MacBook-ul?', timestamp: 'Ieri', read: true },
              { id: '2', senderId: 101, text: 'Are aproximativ 1 an, stare excelentă', timestamp: 'Ieri', read: true },
            ],
            lastMessage: 'Are aproximativ 1 an, stare excelentă',
            lastMessageTime: 'Ieri',
            unreadCount: 0
          }
        ];
        setConversations(demoConversations);
        localStorage.setItem('chat_conversations', JSON.stringify(demoConversations));
      }
    };
    loadConversations();
  }, []);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          messages: [...conv.messages, message],
          lastMessage: newMessage,
          lastMessageTime: message.timestamp
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, message],
      lastMessage: newMessage,
      lastMessageTime: message.timestamp
    } : null);
    setNewMessage('');
    localStorage.setItem('chat_conversations', JSON.stringify(updatedConversations));
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.productTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden flex h-[calc(100vh-120px)] mt-4 mx-4">
          
          {/* Lista de conversaciones */}
          <div className={`w-full md:w-96 border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900 mb-4">Mesaje</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Caută conversații..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#13C1AC]/20"
                />
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                  <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-center">Nu ai conversații încă</p>
                  <p className="text-sm text-center mt-2">Contactează un vânzător pentru a începe o conversație</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      selectedConversation?.id === conv.id ? 'bg-[#13C1AC]/5' : ''
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={conv.participantAvatar}
                        alt={conv.participantName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#13C1AC] text-white text-xs rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900 truncate">{conv.participantName}</h3>
                        <span className="text-xs text-gray-400 shrink-0 ml-2">{conv.lastMessageTime}</span>
                      </div>
                      {conv.productTitle && (
                        <p className="text-xs text-[#13C1AC] truncate">{conv.productTitle}</p>
                      )}
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Área de chat */}
          <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                {/* Header del chat */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img
                    src={selectedConversation.participantAvatar}
                    alt={selectedConversation.participantName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-900">{selectedConversation.participantName}</h2>
                    <p className="text-xs text-gray-500">Activ acum</p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Producto relacionado */}
                {selectedConversation.productTitle && (
                  <Link
                    href={`/product/${selectedConversation.productId}`}
                    className="mx-4 mt-4 p-3 bg-gray-50 rounded-xl flex gap-3 hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={selectedConversation.productImage}
                      alt={selectedConversation.productTitle}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{selectedConversation.productTitle}</p>
                      <p className="text-[#13C1AC] font-bold">{selectedConversation.productPrice?.toLocaleString()} Lei</p>
                    </div>
                  </Link>
                )}

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                          msg.senderId === currentUser.id
                            ? 'bg-[#13C1AC] text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          msg.senderId === currentUser.id ? 'text-white/70' : 'text-gray-400'
                        }`}>
                          <span className="text-[10px]">{msg.timestamp}</span>
                          {msg.senderId === currentUser.id && (
                            msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de mensaje */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Scrie un mesaj..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#13C1AC]/20"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-3 bg-[#13C1AC] text-white rounded-full hover:bg-[#10a593] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <MessageCircle className="w-20 h-20 mb-4 opacity-30" />
                <p className="text-lg font-medium">Selectează o conversație</p>
                <p className="text-sm mt-1">Alege o conversație din lista din stânga</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
