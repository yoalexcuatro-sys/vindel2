'use client'

import { useState, useEffect } from 'react'
import { 
    subscribeToAllTickets, 
    getTicketStats,
    updateTicketStatus,
    updateTicketPriority,
    SupportTicket, 
    STATUS_LABELS, 
    CATEGORY_LABELS,
    PRIORITY_LABELS
} from '@/lib/support-service'
import { 
    Ticket, 
    MessageCircle, 
    CheckCircle, 
    Clock, 
    AlertCircle,
    Filter,
    Search,
    ChevronRight,
    User,
    Mail
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
        case 'low': return 'bg-slate-100 text-slate-600'
        default: return 'bg-slate-100 text-slate-600'
    }
}

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0
    })
    const [statusFilter, setStatusFilter] = useState<SupportTicket['status'] | 'all'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)

    // Load stats
    useEffect(() => {
        async function loadStats() {
            const s = await getTicketStats()
            setStats(s)
        }
        loadStats()
    }, [tickets])

    // Subscribe to tickets
    useEffect(() => {
        setLoading(true)
        const unsubscribe = subscribeToAllTickets(
            (t) => {
                setTickets(t)
                setLoading(false)
            },
            statusFilter === 'all' ? undefined : statusFilter
        )

        return () => unsubscribe()
    }, [statusFilter])

    // Filter tickets by search
    const filteredTickets = tickets.filter(ticket => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            ticket.subject.toLowerCase().includes(query) ||
            ticket.userName.toLowerCase().includes(query) ||
            ticket.userEmail.toLowerCase().includes(query)
        )
    })

    const handleStatusChange = async (ticketId: string, newStatus: SupportTicket['status']) => {
        try {
            await updateTicketStatus(ticketId, newStatus)
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const handlePriorityChange = async (ticketId: string, newPriority: SupportTicket['priority']) => {
        try {
            await updateTicketPriority(ticketId, newPriority)
        } catch (error) {
            console.error('Error updating priority:', error)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Suport Clienți</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestionează tichetele de suport</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <button 
                    onClick={() => setStatusFilter('all')}
                    className={`p-4 rounded-xl border transition-all ${
                        statusFilter === 'all' 
                            ? 'bg-[#13C1AC]/10 border-[#13C1AC] ring-2 ring-[#13C1AC]/20' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                            <Ticket className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-xs text-gray-500">Total</p>
                        </div>
                    </div>
                </button>

                <button 
                    onClick={() => setStatusFilter('open')}
                    className={`p-4 rounded-xl border transition-all ${
                        statusFilter === 'open' 
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-blue-700">{stats.open}</p>
                            <p className="text-xs text-gray-500">Deschise</p>
                        </div>
                    </div>
                </button>

                <button 
                    onClick={() => setStatusFilter('in-progress')}
                    className={`p-4 rounded-xl border transition-all ${
                        statusFilter === 'in-progress' 
                            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
                            <p className="text-xs text-gray-500">În lucru</p>
                        </div>
                    </div>
                </button>

                <button 
                    onClick={() => setStatusFilter('resolved')}
                    className={`p-4 rounded-xl border transition-all ${
                        statusFilter === 'resolved' 
                            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-emerald-700">{stats.resolved}</p>
                            <p className="text-xs text-gray-500">Rezolvate</p>
                        </div>
                    </div>
                </button>

                <button 
                    onClick={() => setStatusFilter('closed')}
                    className={`p-4 rounded-xl border transition-all ${
                        statusFilter === 'closed' 
                            ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-200' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-200">
                            <MessageCircle className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-slate-700">{stats.closed}</p>
                            <p className="text-xs text-gray-500">Închise</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Caută după subiect, nume sau email..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#13C1AC] focus:ring-2 focus:ring-[#13C1AC]/20 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        Se încarcă tichetele...
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <Ticket className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">Nu există tichete în această categorie</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredTickets.map((ticket) => (
                            <div key={ticket.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    {/* User Info */}
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-[#13C1AC]/10 flex items-center justify-center">
                                            <User className="w-5 h-5 text-[#13C1AC]" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <Link 
                                                    href={`/admin/suport/${ticket.id}`}
                                                    className="font-semibold text-gray-900 hover:text-[#13C1AC] transition-colors"
                                                >
                                                    {ticket.subject}
                                                </Link>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                    <span>{ticket.userName}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {ticket.userEmail}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link 
                                                href={`/admin/suport/${ticket.id}`}
                                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                                            >
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            </Link>
                                        </div>

                                        {/* Meta */}
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusColor(ticket.status)}`}>
                                                {STATUS_LABELS[ticket.status]}
                                            </span>
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPriorityColor(ticket.priority)}`}>
                                                {PRIORITY_LABELS[ticket.priority]}
                                            </span>
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                                                {CATEGORY_LABELS[ticket.category]}
                                            </span>
                                            <span className="text-xs text-gray-400 ml-auto">
                                                {ticket.createdAt.toLocaleDateString('ro-RO', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex items-center gap-2 mt-3">
                                            <select 
                                                value={ticket.status}
                                                onChange={(e) => handleStatusChange(ticket.id, e.target.value as SupportTicket['status'])}
                                                className="text-xs px-2 py-1 rounded-lg border border-gray-200 focus:border-[#13C1AC] outline-none"
                                            >
                                                <option value="open">Deschis</option>
                                                <option value="in-progress">În lucru</option>
                                                <option value="resolved">Rezolvat</option>
                                                <option value="closed">Închis</option>
                                            </select>
                                            <select 
                                                value={ticket.priority}
                                                onChange={(e) => handlePriorityChange(ticket.id, e.target.value as SupportTicket['priority'])}
                                                className="text-xs px-2 py-1 rounded-lg border border-gray-200 focus:border-[#13C1AC] outline-none"
                                            >
                                                <option value="low">Scăzută</option>
                                                <option value="medium">Medie</option>
                                                <option value="high">Ridicată</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
