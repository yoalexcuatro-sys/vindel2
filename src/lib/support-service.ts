import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    serverTimestamp,
    Timestamp,
    getDocs,
    getDoc
} from 'firebase/firestore'
import { db } from './firebase'

export interface SupportMessage {
    id: string
    senderId: string
    senderName: string
    senderEmail: string
    isAdmin: boolean
    content: string
    createdAt: Date
}

export interface SupportTicket {
    id: string
    userId: string
    userName: string
    userEmail: string
    subject: string
    category: 'general' | 'account' | 'report' | 'payment' | 'other'
    status: 'open' | 'in-progress' | 'resolved' | 'closed'
    priority: 'low' | 'medium' | 'high'
    messages: SupportMessage[]
    createdAt: Date
    updatedAt: Date
    assignedTo?: string
    assignedToName?: string
}

// Create a new support ticket
export async function createSupportTicket(
    userId: string,
    userName: string,
    userEmail: string,
    subject: string,
    category: SupportTicket['category'],
    initialMessage: string
): Promise<string> {
    const ticketRef = await addDoc(collection(db, 'supportTickets'), {
        userId,
        userName,
        userEmail,
        subject,
        category,
        status: 'open',
        priority: 'medium',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    })

    // Add initial message
    await addDoc(collection(db, 'supportTickets', ticketRef.id, 'messages'), {
        senderId: userId,
        senderName: userName,
        senderEmail: userEmail,
        isAdmin: false,
        content: initialMessage,
        createdAt: serverTimestamp()
    })

    return ticketRef.id
}

// Add message to ticket
export async function addMessageToTicket(
    ticketId: string,
    senderId: string,
    senderName: string,
    senderEmail: string,
    content: string,
    isAdmin: boolean = false
): Promise<void> {
    await addDoc(collection(db, 'supportTickets', ticketId, 'messages'), {
        senderId,
        senderName,
        senderEmail,
        isAdmin,
        content,
        createdAt: serverTimestamp()
    })

    // Update ticket timestamp and status if admin replied
    const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp()
    }
    
    if (isAdmin) {
        updateData.status = 'in-progress'
    }

    await updateDoc(doc(db, 'supportTickets', ticketId), updateData)
}

// Update ticket status
export async function updateTicketStatus(
    ticketId: string, 
    status: SupportTicket['status']
): Promise<void> {
    await updateDoc(doc(db, 'supportTickets', ticketId), {
        status,
        updatedAt: serverTimestamp()
    })
}

// Update ticket priority
export async function updateTicketPriority(
    ticketId: string, 
    priority: SupportTicket['priority']
): Promise<void> {
    await updateDoc(doc(db, 'supportTickets', ticketId), {
        priority,
        updatedAt: serverTimestamp()
    })
}

// Assign ticket to admin
export async function assignTicket(
    ticketId: string, 
    adminId: string, 
    adminName: string
): Promise<void> {
    await updateDoc(doc(db, 'supportTickets', ticketId), {
        assignedTo: adminId,
        assignedToName: adminName,
        status: 'in-progress',
        updatedAt: serverTimestamp()
    })
}

// Get user's tickets
export function subscribeToUserTickets(
    userId: string,
    callback: (tickets: SupportTicket[]) => void
): () => void {
    const q = query(
        collection(db, 'supportTickets'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                userId: data.userId,
                userName: data.userName,
                userEmail: data.userEmail,
                subject: data.subject,
                category: data.category,
                status: data.status,
                priority: data.priority,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
                assignedTo: data.assignedTo,
                assignedToName: data.assignedToName,
                messages: []
            } as SupportTicket
        })
        callback(tickets)
    }, (error) => {
        console.error('[SUPPORT] Error subscribing to user tickets:', error)
        // Return empty array on error to stop loading
        callback([])
    })
}

// Get all tickets (admin)
export function subscribeToAllTickets(
    callback: (tickets: SupportTicket[]) => void,
    statusFilter?: SupportTicket['status']
): () => void {
    let q = query(
        collection(db, 'supportTickets'),
        orderBy('updatedAt', 'desc')
    )

    if (statusFilter) {
        q = query(
            collection(db, 'supportTickets'),
            where('status', '==', statusFilter),
            orderBy('updatedAt', 'desc')
        )
    }

    return onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                userId: data.userId,
                userName: data.userName,
                userEmail: data.userEmail,
                subject: data.subject,
                category: data.category,
                status: data.status,
                priority: data.priority,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
                assignedTo: data.assignedTo,
                assignedToName: data.assignedToName,
                messages: []
            } as SupportTicket
        })
        callback(tickets)
    }, (error) => {
        console.error('[SUPPORT] Error subscribing to all tickets:', error)
        callback([])
    })
}

// Get ticket messages
export function subscribeToTicketMessages(
    ticketId: string,
    callback: (messages: SupportMessage[]) => void
): () => void {
    const q = query(
        collection(db, 'supportTickets', ticketId, 'messages'),
        orderBy('createdAt', 'asc')
    )

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date()
        })) as SupportMessage[]
        callback(messages)
    }, (error) => {
        console.error('[SUPPORT] Error subscribing to ticket messages:', error)
        callback([])
    })
}

// Get single ticket
export async function getTicket(ticketId: string): Promise<SupportTicket | null> {
    const ticketDoc = await getDoc(doc(db, 'supportTickets', ticketId))
    if (!ticketDoc.exists()) return null

    const data = ticketDoc.data()
    return {
        id: ticketDoc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        subject: data.subject,
        category: data.category,
        status: data.status,
        priority: data.priority,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
        assignedTo: data.assignedTo,
        assignedToName: data.assignedToName,
        messages: []
    } as SupportTicket
}

// Get ticket stats (admin)
export async function getTicketStats(): Promise<{
    total: number
    open: number
    inProgress: number
    resolved: number
    closed: number
}> {
    const snapshot = await getDocs(collection(db, 'supportTickets'))
    const stats = {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0
    }

    snapshot.docs.forEach(doc => {
        stats.total++
        const status = doc.data().status as SupportTicket['status']
        if (status === 'open') stats.open++
        else if (status === 'in-progress') stats.inProgress++
        else if (status === 'resolved') stats.resolved++
        else if (status === 'closed') stats.closed++
    })

    return stats
}

// Category labels
export const CATEGORY_LABELS: Record<SupportTicket['category'], string> = {
    general: 'Întrebare generală',
    account: 'Probleme cu contul',
    report: 'Raportare anunț/utilizator',
    payment: 'Plăți și facturare',
    other: 'Altele'
}

// Status labels
export const STATUS_LABELS: Record<SupportTicket['status'], string> = {
    'open': 'Deschis',
    'in-progress': 'În lucru',
    'resolved': 'Rezolvat',
    'closed': 'Închis'
}

// Priority labels
export const PRIORITY_LABELS: Record<SupportTicket['priority'], string> = {
    low: 'Scăzută',
    medium: 'Medie',
    high: 'Ridicată'
}
