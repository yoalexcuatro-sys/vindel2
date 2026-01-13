import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  productId?: string;
  productTitle?: string;
  productImage?: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  unreadCount: Record<string, number>;
  createdAt: Timestamp;
}

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

// Create or get existing conversation
export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
  userNames: Record<string, string>,
  userAvatars: Record<string, string>,
  productData?: {
    productId: string;
    productTitle: string;
    productImage: string;
  }
): Promise<string> {
  // Check if conversation already exists
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participants', 'array-contains', userId)
  );

  const querySnapshot = await getDocs(q);
  
  for (const doc of querySnapshot.docs) {
    const conv = doc.data() as Conversation;
    if (conv.participants.includes(otherUserId)) {
      // If same product or no product specified
      if (!productData || conv.productId === productData.productId) {
        return doc.id;
      }
    }
  }

  // Create new conversation
  const newConversation: Omit<Conversation, 'id'> = {
    participants: [userId, otherUserId],
    participantNames: userNames,
    participantAvatars: userAvatars,
    productId: productData?.productId,
    productTitle: productData?.productTitle,
    productImage: productData?.productImage,
    unreadCount: { [userId]: 0, [otherUserId]: 0 },
    createdAt: serverTimestamp() as Timestamp,
    lastMessageAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), newConversation);
  return docRef.id;
}

// Get user's conversations
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participants', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const conversations: Conversation[] = [];

  querySnapshot.forEach((doc) => {
    conversations.push({ id: doc.id, ...doc.data() } as Conversation);
  });

  return conversations;
}

// Subscribe to user's conversations (real-time)
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  // Query without orderBy to avoid index requirement
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const conversations: Conversation[] = [];
    querySnapshot.forEach((doc) => {
      conversations.push({ id: doc.id, ...doc.data() } as Conversation);
    });
    // Sort client-side by lastMessageAt or createdAt
    conversations.sort((a, b) => {
      const aTime = a.lastMessageAt?.toMillis() || a.createdAt?.toMillis() || 0;
      const bTime = b.lastMessageAt?.toMillis() || b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });
    callback(conversations);
  });
}

// Send a message
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<string> {
  // Add message
  const message: Omit<Message, 'id'> = {
    conversationId,
    senderId,
    text,
    createdAt: serverTimestamp() as Timestamp,
    read: false,
  };

  const messageRef = await addDoc(collection(db, MESSAGES_COLLECTION), message);

  // Update conversation with last message
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const conversationSnap = await getDoc(conversationRef);
  
  if (conversationSnap.exists()) {
    const conv = conversationSnap.data() as Conversation;
    const otherUserId = conv.participants.find(p => p !== senderId);
    
    await updateDoc(conversationRef, {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      [`unreadCount.${otherUserId}`]: (conv.unreadCount[otherUserId!] || 0) + 1,
    });
  }

  return messageRef.id;
}

// Get messages for a conversation
export async function getMessages(
  conversationId: string,
  messageLimit: number = 50
): Promise<Message[]> {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc'),
    limit(messageLimit)
  );

  const querySnapshot = await getDocs(q);
  const messages: Message[] = [];

  querySnapshot.forEach((doc) => {
    messages.push({ id: doc.id, ...doc.data() } as Message);
  });

  return messages;
}

// Subscribe to messages (real-time)
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as Message);
    });
    callback(messages);
  });
}

// Mark messages as read
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  // Reset unread count for user
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  await updateDoc(conversationRef, {
    [`unreadCount.${userId}`]: 0,
  });

  // Mark individual messages as read
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    where('read', '==', false)
  );

  const querySnapshot = await getDocs(q);
  const updatePromises = querySnapshot.docs
    .filter(docSnap => docSnap.data().senderId !== userId)
    .map(docSnap => updateDoc(doc(db, MESSAGES_COLLECTION, docSnap.id), { read: true }));

  await Promise.all(updatePromises);
}

// Get unread message count for user
export async function getUnreadCount(userId: string): Promise<number> {
  const conversations = await getUserConversations(userId);
  return conversations.reduce((total, conv) => total + (conv.unreadCount[userId] || 0), 0);
}
