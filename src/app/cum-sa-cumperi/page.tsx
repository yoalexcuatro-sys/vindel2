'use client'

import { Search, MessageSquare, MapPin, CreditCard, CheckCircle2, AlertTriangle, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

const steps = [
    {
        icon: Search,
        title: 'Găsește ce cauți',
        description: 'Folosește căutarea și filtrele pentru a găsi exact produsul dorit.',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        icon: MessageSquare,
        title: 'Contactează vânzătorul',
        description: 'Trimite un mesaj pentru a afla mai multe detalii și a negocia prețul.',
        color: 'from-purple-500 to-pink-500'
    },
    {
        icon: MapPin,
        title: 'Stabilește întâlnirea',
        description: 'Alege un loc public și sigur pentru a vedea și prelua produsul.',
        color: 'from-amber-500 to-orange-500'
    },
    {
        icon: CreditCard,
        title: 'Finalizează tranzacția',
        description: 'Verifică produsul și efectuează plata doar când ești mulțumit.',
        color: 'from-emerald-500 to-teal-500'
    }
]

const safetyTips = [
    'Verifică profilul și recenziile vânzătorului',
    'Nu efectua plăți în avans pentru produse necontrolate',
    'Întâlnește-te în locuri publice, aglomerate',
    'Inspectează produsul înainte de a plăti',
    'Păstrează conversațiile pe platformă',
    'Raportează comportamentul suspect'
]

export default function CumSaCumperiPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero with Wave */}
            <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <svg className="absolute w-full h-full">
                        <defs>
                            <pattern id="circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                <circle cx="20" cy="20" r="2" fill="white"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#circles)"/>
                    </svg>
                </div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/10 rounded-full"></div>
                
                <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                        <ShoppingBag className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Cum să cumperi pe Vindel</h1>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto">
                        Ghid pentru a cumpăra în siguranță și a găsi cele mai bune oferte
                    </p>
                </div>
                
                <svg className="absolute -bottom-1 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <path fill="#f8fafc" d="M0,96L48,85.3C96,75,192,53,288,58.7C384,64,480,96,576,101.3C672,107,768,85,864,74.7C960,64,1056,64,1152,69.3C1248,75,1344,85,1392,90.7L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
                </svg>
            </div>

            {/* Steps */}
            <div className="max-w-5xl mx-auto px-4 py-16">
                <h2 className="text-2xl font-bold text-slate-800 mb-12 text-center">Procesul de cumpărare</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                    {steps.map((step, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all group">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${step.color} text-white group-hover:scale-110 transition-transform`}>
                                    <step.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-slate-400">Pas {index + 1}</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-1">{step.title}</h3>
                                    <p className="text-slate-500">{step.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-gradient-to-r from-[#13C1AC]/5 to-[#0EA89A]/10">
                <div className="max-w-5xl mx-auto px-4 py-16">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-3">Cumpără în siguranță</h2>
                        <p className="text-slate-600">Urmează aceste sfaturi pentru tranzacții sigure</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {safetyTips.map((tip, index) => (
                            <div key={index} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-[#13C1AC]/10 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-[#13C1AC]" />
                                </div>
                                <span className="text-slate-600 text-sm">{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Warning */}
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-red-100">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Atenție la fraude!</h3>
                        <p className="text-slate-600">
                            Nu trimite bani în avans și nu furniza date bancare sau personale. Dacă o ofertă pare prea bună pentru a fi adevărată, probabil că este o înșelătorie. 
                            <Link href="/siguranta" className="text-[#13C1AC] font-medium ml-1 hover:underline">Află mai multe despre siguranță →</Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="bg-slate-900 text-white">
                <div className="max-w-5xl mx-auto px-4 py-16 text-center">
                    <h2 className="text-2xl font-bold mb-4">Începe să explorezi</h2>
                    <p className="text-slate-300 mb-8">Mii de produse te așteaptă la prețuri excelente</p>
                    <Link 
                        href="/search"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[#13C1AC] text-white font-semibold rounded-xl hover:bg-[#0EA89A] transition-colors"
                    >
                        <Search className="w-5 h-5" />
                        Caută produse
                    </Link>
                </div>
            </div>
        </div>
    )
}
