// Sistema de mensajería basado en localStorage

// Helper para formatear nombre público (Alexandru Bugeag -> Alexandru B.)
export function formatPublicName(name: string): string {
  if (!name) return 'Utilizator';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string | number;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantIds: (string | number)[];
  productId: string | number;
  productTitle: string;
  productImage: string;
  productPrice: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const CONVERSATIONS_KEY = 'vindu_conversations';
const MESSAGES_KEY = 'vindu_messages';

export function getConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CONVERSATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

export function getMessages(conversationId: string): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(MESSAGES_KEY);
    const allMessages: Message[] = saved ? JSON.parse(saved) : [];
    return allMessages.filter(m => m.conversationId === conversationId);
  } catch {
    return [];
  }
}

export function getAllMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(MESSAGES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveMessage(message: Message) {
  if (typeof window === 'undefined') return;
  const allMessages = getAllMessages();
  allMessages.push(message);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
  
  // Actualizar última conversación
  const conversations = getConversations();
  const convIndex = conversations.findIndex(c => c.id === message.conversationId);
  if (convIndex >= 0) {
    conversations[convIndex].lastMessage = message.content;
    conversations[convIndex].lastMessageTime = message.timestamp;
    if (message.senderId !== 101) { // Si no es el usuario actual
      conversations[convIndex].unreadCount++;
    }
    saveConversations(conversations);
  }
}

export function createOrGetConversation(
  productId: string | number,
  productTitle: string,
  productImage: string,
  productPrice: number,
  sellerId: string | number,
  sellerName: string
): Conversation {
  const conversations = getConversations();
  const currentUserId = 101; // Usuario actual (hardcoded por ahora)
  
  // Buscar conversación existente
  const existing = conversations.find(
    c => c.productId === productId && 
         c.participantIds.includes(currentUserId) && 
         (c.participantIds.includes(sellerId) || c.participantIds.includes(String(sellerId)))
  );
  
  if (existing) return existing;
  
  // Crear nueva conversación
  const newConversation: Conversation = {
    id: `conv_${Date.now()}`,
    participantIds: [currentUserId, sellerId],
    productId,
    productTitle,
    productImage,
    productPrice,
    lastMessage: '',
    lastMessageTime: new Date().toISOString(),
    unreadCount: 0
  };
  
  conversations.unshift(newConversation);
  saveConversations(conversations);
  
  return newConversation;
}

export function markConversationAsRead(conversationId: string) {
  const conversations = getConversations();
  const convIndex = conversations.findIndex(c => c.id === conversationId);
  if (convIndex >= 0) {
    conversations[convIndex].unreadCount = 0;
    saveConversations(conversations);
  }
  
  // Marcar mensajes como leídos
  const allMessages = getAllMessages();
  const updated = allMessages.map(m => 
    m.conversationId === conversationId ? { ...m, read: true } : m
  );
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
}

export function deleteConversation(conversationId: string) {
  // Eliminar conversación
  const conversations = getConversations();
  const filtered = conversations.filter(c => c.id !== conversationId);
  saveConversations(filtered);
  
  // Eliminar mensajes de esa conversación
  const allMessages = getAllMessages();
  const filteredMessages = allMessages.filter(m => m.conversationId !== conversationId);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(filteredMessages));
}

export function getTotalUnreadCount(): number {
  const conversations = getConversations();
  return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
}
