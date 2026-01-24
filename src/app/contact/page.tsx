'use client'

import { Mail, Phone, MapPin, Clock, Send, MessageCircle, HelpCircle, AlertTriangle, Ticket, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createSupportTicket, subscribeToUserTickets, SupportTicket, STATUS_LABELS, CATEGORY_LABELS } from '@/lib/support-service'
import Link from 'next/link'

const contactMethods = [
    {
        icon: Mail,
        title: 'Email',
        value: 'support@vindel.ro',
        description: 'Răspundem în maxim 24h',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        icon: Phone,
        title: 'Telefon',
        value: '+40 XXX XXX XXX',
        description: 'Luni - Vineri, 9:00 - 18:00',
        color: 'from-emerald-500 to-teal-500'
    },
    {
        icon: MapPin,
        title: 'Adresă',
        value: 'București, România',
        description: 'Doar cu programare',
        color: 'from-purple-500 to-pink-500'
    }
]

const faqItems = [
    {
        question: 'Cum pot șterge un anunț?',
        answer: 'Accesează profilul tău, apoi secțiunea "Anunțurile mele". Găsește anunțul dorit și apasă pe butonul de ștergere.'
    },
    {
        question: 'Cum raportez un utilizator?',
        answer: 'Pe pagina anunțului sau profilului utilizatorului, găsești opțiunea "Raportează". Completează motivul și noi vom investiga.'
    },
    {
        question: 'Cât durează publicarea unui anunț?',
        answer: 'Anunțurile sunt publicate instant. În cazuri rare, pot fi verificate manual și pot dura până la 24h.'
    }
]

function getStatusColor(status: SupportTicket['status']) {
    switch (status) {
        case 'open': return 'bg-blue-100 text-blue-700'
        case 'in-progress': return 'bg-amber-100 text-amber-700'
        case 'resolved': return 'bg-emerald-100 text-emerald-700'
        case 'closed': return 'bg-slate-100 text-slate-700'
        default: return 'bg-slate-100 text-slate-700'
    }
}

export default function ContactPage() {
    const { user, userProfile } = useAuth()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '' as SupportTicket['category'] | '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [ticketId, setTicketId] = useState<string | null>(null)
    const [userTickets, setUserTickets] = useState<SupportTicket[]>([])
    const [showTickets, setShowTickets] = useState(false)

    // Pre-fill form with user data
    useEffect(() => {
        if (user && userProfile) {
            setFormData(prev => ({
                ...prev,
                name: userProfile.displayName || '',
                email: user.email || ''
            }))
        }
    }, [user, userProfile])

    // Subscribe to user tickets
    useEffect(() => {
        if (!user) return

        const unsubscribe = subscribeToUserTickets(user.uid, (tickets) => {
            setUserTickets(tickets)
        })

        return () => unsubscribe()
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.subject) return

        setIsSubmitting(true)

        try {
            const newTicketId = await createSupportTicket(
                user?.uid || 'guest',
                formData.name,
                formData.email,
                formData.subject === 'general' ? 'Întrebare generală' :
                formData.subject === 'account' ? 'Probleme cu contul' :
                formData.subject === 'report' ? 'Raportare' :
                formData.subject === 'payment' ? 'Plăți și facturare' : 'Altele',
                formData.subject,
                formData.message
            )
            setTicketId(newTicketId)
            setSubmitted(true)
        } catch (error) {
            console.error('Error creating ticket:', error)
            alert('A apărut o eroare. Te rugăm să încerci din nou.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero with Animated Squares */}
            <div className="relative bg-gradient-to-br from-[#13C1AC] via-emerald-500 to-teal-600 overflow-hidden">
                {/* Animated floating squares */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Square 1 */}
                    <div className="absolute w-20 h-20 border-2 border-white/20 rounded-lg animate-float-slow" 
                         style={{ top: '10%', left: '5%', animationDelay: '0s' }}></div>
                    {/* Square 2 */}
                    <div className="absolute w-16 h-16 border-2 border-white/15 rounded-lg animate-float-slower" 
                         style={{ top: '60%', left: '15%', animationDelay: '2s' }}></div>
                    {/* Square 3 */}
                    <div className="absolute w-24 h-24 border-2 border-white/10 rounded-xl animate-float-slow" 
                         style={{ top: '20%', right: '10%', animationDelay: '1s' }}></div>
                    {/* Square 4 */}
                    <div className="absolute w-12 h-12 bg-white/10 rounded-lg animate-float-slower" 
                         style={{ top: '70%', right: '20%', animationDelay: '3s' }}></div>
                    {/* Square 5 */}
                    <div className="absolute w-14 h-14 border-2 border-white/20 rounded-lg animate-float-slow" 
                         style={{ top: '40%', left: '40%', animationDelay: '0.5s' }}></div>
                    {/* Square 6 */}
                    <div className="absolute w-10 h-10 bg-white/5 rounded-md animate-float-slower" 
                         style={{ top: '80%', left: '60%', animationDelay: '1.5s' }}></div>
                    {/* Square 7 */}
                    <div className="absolute w-8 h-8 border border-white/25 rounded animate-float-slow" 
                         style={{ top: '15%', left: '70%', animationDelay: '2.5s' }}></div>
                    {/* Square 8 */}
                    <div className="absolute w-18 h-18 border-2 border-white/15 rounded-lg animate-float-slower" 
                         style={{ top: '50%', right: '5%', animationDelay: '4s' }}></div>
                </div>
                
                <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6 backdrop-blur-sm">
                        <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contactează-ne</h1>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto">
                        Suntem aici să te ajutăm. Alege metoda preferată de contact.
                    </p>
                </div>
                
                <svg className="absolute -bottom-1 w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
                    <path fill="#f8fafc" d="M0,0 L0,60 Q360,100 720,60 T1440,60 L1440,100 L0,100 Z"></path>
                </svg>
            </div>

            {/* Contact Methods */}
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="grid md:grid-cols-3 gap-6">
                    {contactMethods.map((method, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all text-center group">
                            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${method.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                                <method.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">{method.title}</h3>
                            <p className="text-[#13C1AC] font-medium mb-1">{method.value}</p>
                            <p className="text-sm text-slate-400">{method.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* User's Tickets */}
            {user && userTickets.length > 0 && (
                <div className="max-w-5xl mx-auto px-4 pb-8">
                    <button 
                        onClick={() => setShowTickets(!showTickets)}
                        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-100">
                                    <Ticket className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-slate-800">Tichetele tale de suport</h3>
                                    <p className="text-sm text-slate-500">{userTickets.length} tichete</p>
                                </div>
                            </div>
                            <span className={`transform transition-transform ${showTickets ? 'rotate-180' : ''}`}>▼</span>
                        </div>
                    </button>
                    
                    {showTickets && (
                        <div className="mt-4 space-y-3">
                            {userTickets.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={`/suport/${ticket.id}`}
                                    className="block bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-purple-200 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-slate-800">{ticket.subject}</h4>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                                            {STATUS_LABELS[ticket.status]}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">{CATEGORY_LABELS[ticket.category]}</span>
                                        <span className="text-slate-400">
                                            {ticket.updatedAt.toLocaleDateString('ro-RO')}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Contact Form & FAQ */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Form */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-[#13C1AC]/10">
                                <Send className="w-6 h-6 text-[#13C1AC]" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Trimite un mesaj</h2>
                        </div>

                        {submitted ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Send className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">Tichet creat cu succes!</h3>
                                <p className="text-slate-500 mb-4">Îți vom răspunde în cel mai scurt timp posibil.</p>
                                {ticketId && (
                                    <Link 
                                        href={`/suport/${ticketId}`}
                                        className="inline-flex items-center gap-2 text-[#13C1AC] hover:underline"
                                    >
                                        Vezi tichetul <ExternalLink className="w-4 h-4" />
                                    </Link>
                                )}
                                <button 
                                    onClick={() => {
                                        setSubmitted(false)
                                        setTicketId(null)
                                        setFormData(prev => ({ ...prev, subject: '', message: '' }))
                                    }}
                                    className="block mx-auto mt-4 text-sm text-slate-500 hover:text-slate-700"
                                >
                                    Trimite alt mesaj
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nume</label>
                                    <input 
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#13C1AC] focus:ring-2 focus:ring-[#13C1AC]/20 outline-none transition-all"
                                        placeholder="Numele tău"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input 
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#13C1AC] focus:ring-2 focus:ring-[#13C1AC]/20 outline-none transition-all"
                                        placeholder="email@exemplu.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subiect</label>
                                    <select 
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({...formData, subject: e.target.value as SupportTicket['category']})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#13C1AC] focus:ring-2 focus:ring-[#13C1AC]/20 outline-none transition-all"
                                    >
                                        <option value="">Selectează subiectul</option>
                                        <option value="general">Întrebare generală</option>
                                        <option value="account">Probleme cu contul</option>
                                        <option value="report">Raportare anunț/utilizator</option>
                                        <option value="payment">Plăți și facturare</option>
                                        <option value="other">Altele</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mesaj</label>
                                    <textarea 
                                        required
                                        rows={4}
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#13C1AC] focus:ring-2 focus:ring-[#13C1AC]/20 outline-none transition-all resize-none"
                                        placeholder="Descrie problema sau întrebarea ta..."
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-gradient-to-r from-[#13C1AC] to-[#0EA89A] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#13C1AC]/25 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Se trimite...' : 'Trimite mesajul'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* FAQ */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-amber-100">
                                <HelpCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Întrebări frecvente</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {faqItems.map((item, index) => (
                                <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                                    <h3 className="font-semibold text-slate-800 mb-2">{item.question}</h3>
                                    <p className="text-slate-500 text-sm">{item.answer}</p>
                                </div>
                            ))}
                        </div>

                        {/* Emergency */}
                        <div className="mt-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-5 border border-red-100">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Urgență?</h3>
                                    <p className="text-sm text-slate-600">
                                        Pentru situații urgente sau raportări de fraudă, contactează-ne telefonic pentru un răspuns imediat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Working Hours */}
            <div className="bg-slate-900 text-white mt-12">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/10">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Program suport</h3>
                                <p className="text-slate-400">Luni - Vineri: 9:00 - 18:00</p>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-slate-400 text-sm">Timp mediu de răspuns</p>
                            <p className="text-2xl font-bold text-[#13C1AC]">&lt; 24 ore</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
