'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { 
    getTicket, 
    subscribeToTicketMessages, 
    addMessageToTicket,
    SupportTicket, 
    SupportMessage,
    STATUS_LABELS,
    CATEGORY_LABELS,
    PRIORITY_LABELS
} from '@/lib/support-service'
import { ArrowLeft, Send, Clock, User, Shield, Loader2 } from 'lucide-react'
import Link from 'next/link'

function getStatusColor(status: SupportTicket['status']) {
    switch (status) {
        case 'open': return 'bg-blue-100 text-blue-700'
        case 'in-progress': return 'bg-amber-100 text-amber-700'
        case 'resolved': return 'bg-emerald-100 text-emerald-700'
        case 'closed': return 'bg-slate-100 text-slate-700'
        default: return 'bg-slate-100 text-slate-700'
    }
}

function getPriorityColor(priority: SupportTicket['priority']) {
    switch (priority) {
        case 'high': return 'bg-red-100 text-red-700'
        case 'medium': return 'bg-amber-100 text-amber-700'
        case 'low': return 'bg-slate-100 text-slate-700'
        default: return 'bg-slate-100 text-slate-700'
    }
}

export default function SupportTicketPage() {
    const params = useParams()
    const router = useRouter()
    const { user, userProfile } = useAuth()
    const [ticket, setTicket] = useState<SupportTicket | null>(null)
    const [messages, setMessages] = useState<SupportMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const ticketId = params.id as string

    // Load ticket
    useEffect(() => {
        async function loadTicket() {
            if (!ticketId) return
            
            const ticketData = await getTicket(ticketId)
            if (ticketData) {
                setTicket(ticketData)
            }
            setLoading(false)
        }
        loadTicket()
    }, [ticketId])

    // Subscribe to messages
    useEffect(() => {
        if (!ticketId) return

        const unsubscribe = subscribeToTicketMessages(ticketId, (msgs) => {
            setMessages(msgs)
        })

        return () => unsubscribe()
    }, [ticketId])

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !user || !ticket) return

        setSending(true)
        try {
            await addMessageToTicket(
                ticketId,
                user.uid,
                userProfile?.displayName || 'Usuario',
                user.email || '',
                newMessage.trim(),
                false // not admin
            )
            setNewMessage('')
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#13C1AC] animate-spin" />
            </div>
        )
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate-800 mb-2">Tichet negăsit</h2>
                    <p className="text-slate-500 mb-4">Tichetul solicitat nu există sau a fost șters.</p>
                    <Link href="/contact" className="text-[#13C1AC] hover:underline">
                        ← Înapoi la contact
                    </Link>
                </div>
            </div>
        )
    }

    // Check if user has access
    if (user?.uid !== ticket.userId && userProfile?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate-800 mb-2">Acces restricționat</h2>
                    <p className="text-slate-500 mb-4">Nu ai permisiunea să vezi acest tichet.</p>
                    <Link href="/contact" className="text-[#13C1AC] hover:underline">
                        ← Înapoi la contact
                    </Link>
                </div>
            </div>
        )
    }

    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved'

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex-1">
                            <h1 className="font-semibold text-slate-800">{ticket.subject}</h1>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <span>{CATEGORY_LABELS[ticket.category]}</span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                    {STATUS_LABELS[ticket.status]}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                    {PRIORITY_LABELS[ticket.priority]}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="space-y-4 mb-6">
                    {messages.map((message) => (
                        <div 
                            key={message.id}
                            className={`flex ${message.isAdmin ? 'justify-start' : 'justify-end'}`}
                        >
                            <div className={`max-w-[80%] ${message.isAdmin ? 'order-2' : 'order-1'}`}>
                                <div className={`flex items-center gap-2 mb-1 ${message.isAdmin ? '' : 'justify-end'}`}>
                                    {message.isAdmin ? (
                                        <div className="w-6 h-6 rounded-full bg-[#13C1AC] flex items-center justify-center">
                                            <Shield className="w-3 h-3 text-white" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                            <User className="w-3 h-3 text-slate-600" />
                                        </div>
                                    )}
                                    <span className="text-xs font-medium text-slate-600">
                                        {message.isAdmin ? 'Suport Vindu' : message.senderName}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {message.createdAt.toLocaleString('ro-RO', { 
                                            day: '2-digit', 
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <div className={`rounded-2xl px-4 py-3 ${
                                    message.isAdmin 
                                        ? 'bg-white border border-slate-200 rounded-tl-sm' 
                                        : 'bg-[#13C1AC] text-white rounded-tr-sm'
                                }`}>
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {isClosed ? (
                    <div className="bg-slate-100 rounded-xl p-4 text-center">
                        <p className="text-slate-600 text-sm">
                            Acest tichet a fost {ticket.status === 'resolved' ? 'rezolvat' : 'închis'}. 
                            Dacă ai nevoie de ajutor suplimentar, te rugăm să deschizi un tichet nou.
                        </p>
                        <Link 
                            href="/contact"
                            className="inline-block mt-3 text-[#13C1AC] hover:underline text-sm font-medium"
                        >
                            Deschide tichet nou →
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-end gap-3">
                            <textarea 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Scrie un mesaj..."
                                rows={2}
                                className="flex-1 resize-none border-0 focus:ring-0 p-0 text-slate-800 placeholder:text-slate-400"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSendMessage(e)
                                    }
                                }}
                            />
                            <button 
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="p-3 bg-[#13C1AC] text-white rounded-xl hover:bg-[#0EA89A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* Info */}
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>Tiempo medio de respuesta: menos de 24 horas</span>
                </div>
            </div>
        </div>
    )
}
