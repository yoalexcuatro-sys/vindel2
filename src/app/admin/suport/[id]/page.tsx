'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { 
    getTicket, 
    subscribeToTicketMessages, 
    addMessageToTicket,
    updateTicketStatus,
    updateTicketPriority,
    SupportTicket, 
    SupportMessage,
    STATUS_LABELS,
    CATEGORY_LABELS,
    PRIORITY_LABELS
} from '@/lib/support-service'
import { 
    ArrowLeft, 
    Send, 
    Clock, 
    User, 
    Shield, 
    Loader2, 
    Mail,
    Calendar,
    Tag,
    AlertCircle
} from 'lucide-react'
import Link from 'next/link'

function getStatusColor(status: SupportTicket['status']) {
    switch (status) {
        case 'open': return 'bg-blue-100 text-blue-700 border-blue-200'
        case 'in-progress': return 'bg-amber-100 text-amber-700 border-amber-200'
        case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        case 'closed': return 'bg-slate-100 text-slate-700 border-slate-200'
        default: return 'bg-slate-100 text-slate-700 border-slate-200'
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

export default function AdminSupportTicketPage() {
    const params = useParams()
    const router = useRouter()
    const { user, userProfile } = useAuth()
    const [ticket, setTicket] = useState<SupportTicket | null>(null)
    const [messages, setMessages] = useState<SupportMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(false)
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
                'Suport Vindu',
                user.email || '',
                newMessage.trim(),
                true // IS admin
            )
            setNewMessage('')
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setSending(false)
        }
    }

    const handleStatusChange = async (newStatus: SupportTicket['status']) => {
        if (!ticket || updatingStatus) return
        setUpdatingStatus(true)
        try {
            console.log('[SUPPORT] Updating status to:', newStatus)
            await updateTicketStatus(ticketId, newStatus)
            setTicket({ ...ticket, status: newStatus })
            console.log('[SUPPORT] Status updated successfully!')
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Error al actualizar el estado: ' + (error as Error).message)
        } finally {
            setUpdatingStatus(false)
        }
    }

    const handlePriorityChange = async (newPriority: SupportTicket['priority']) => {
        if (!ticket || updatingStatus) return
        setUpdatingStatus(true)
        try {
            console.log('[SUPPORT] Updating priority to:', newPriority)
            await updateTicketPriority(ticketId, newPriority)
            setTicket({ ...ticket, priority: newPriority })
            console.log('[SUPPORT] Priority updated successfully!')
        } catch (error) {
            console.error('Error updating priority:', error)
            alert('Error al actualizar prioridad: ' + (error as Error).message)
        } finally {
            setUpdatingStatus(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#13C1AC] animate-spin" />
            </div>
        )
    }

    if (!ticket) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Tichet negăsit</h2>
                <p className="text-slate-500 mb-4">Tichetul solicitat nu există sau a fost șters.</p>
                <Link href="/admin/suport" className="text-[#13C1AC] hover:underline">
                    ← Înapoi la tichete
                </Link>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chat Area */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/admin/suport"
                            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="font-semibold text-gray-900">{ticket.subject}</h1>
                            <p className="text-sm text-gray-500">{CATEGORY_LABELS[ticket.category]}</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div 
                            key={message.id}
                            className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%]`}>
                                <div className={`flex items-center gap-2 mb-1 ${message.isAdmin ? 'justify-end' : ''}`}>
                                    {!message.isAdmin && (
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                            <User className="w-3 h-3 text-slate-600" />
                                        </div>
                                    )}
                                    <span className="text-xs font-medium text-slate-600">
                                        {message.isAdmin ? 'Tu (Suport)' : message.senderName}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {message.createdAt.toLocaleString('ro-RO', { 
                                            day: '2-digit', 
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                    {message.isAdmin && (
                                        <div className="w-6 h-6 rounded-full bg-[#13C1AC] flex items-center justify-center">
                                            <Shield className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className={`rounded-2xl px-4 py-3 ${
                                    message.isAdmin 
                                        ? 'bg-[#13C1AC] text-white rounded-tr-sm' 
                                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                                }`}>
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                        <textarea 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Scrie un răspuns..."
                            rows={2}
                            className="flex-1 resize-none rounded-xl border border-gray-200 p-3 text-slate-800 placeholder:text-slate-400 focus:border-[#13C1AC] focus:ring-2 focus:ring-[#13C1AC]/20 outline-none"
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
                    </form>
                </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
                {/* User Info */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-[#13C1AC]" />
                        Informații utilizator
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#13C1AC]/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-[#13C1AC]" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{ticket.userName}</p>
                                <p className="text-sm text-gray-500">Utilizator</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {ticket.userEmail}
                        </div>
                        <Link 
                            href={`/user/${ticket.userId}`}
                            className="block text-sm text-[#13C1AC] hover:underline"
                        >
                            Vezi profilul →
                        </Link>
                    </div>
                </div>

                {/* Ticket Info */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-[#13C1AC]" />
                        Detalii tichet
                    </h3>
                    <div className="space-y-4">
                        {/* Status */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                            <select 
                                value={ticket.status}
                                onChange={(e) => handleStatusChange(e.target.value as SupportTicket['status'])}
                                className={`w-full px-3 py-2 rounded-lg border font-medium text-sm ${getStatusColor(ticket.status)}`}
                            >
                                <option value="open">Deschis</option>
                                <option value="in-progress">În lucru</option>
                                <option value="resolved">Rezolvat</option>
                                <option value="closed">Închis</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Prioritate</label>
                            <select 
                                value={ticket.priority}
                                onChange={(e) => handlePriorityChange(e.target.value as SupportTicket['priority'])}
                                className={`w-full px-3 py-2 rounded-lg border border-gray-200 font-medium text-sm ${getPriorityColor(ticket.priority)}`}
                            >
                                <option value="low">Scăzută</option>
                                <option value="medium">Medie</option>
                                <option value="high">Ridicată</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Categorie</label>
                            <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">
                                {CATEGORY_LABELS[ticket.category]}
                            </div>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Creat la</label>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {ticket.createdAt.toLocaleDateString('ro-RO', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-[#13C1AC]" />
                        Acțiuni rapide
                    </h3>
                    <div className="space-y-2">
                        <button 
                            onClick={() => handleStatusChange('resolved')}
                            disabled={updatingStatus}
                            className="w-full px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {updatingStatus ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                '✓'
                            )}
                            Marchează ca rezolvat
                        </button>
                        <button 
                            onClick={() => handleStatusChange('closed')}
                            disabled={updatingStatus}
                            className="w-full px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {updatingStatus ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                '✕'
                            )}
                            Închide tichetul
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
