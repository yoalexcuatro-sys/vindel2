'use client'

import { Shield, AlertTriangle, Eye, Lock, UserCheck, MessageCircle, Phone, Flag, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

const securityTips = [
    {
        icon: Eye,
        title: 'Verifică profilul',
        description: 'Analizează istoricul vânzătorului, recenziile și vechimea contului'
    },
    {
        icon: Lock,
        title: 'Protejează datele',
        description: 'Nu partaja niciodată parole, date bancare sau documente personale'
    },
    {
        icon: UserCheck,
        title: 'Întâlniri sigure',
        description: 'Alege locuri publice și aglomerate pentru a vedea produsul'
    },
    {
        icon: MessageCircle,
        title: 'Comunică pe platformă',
        description: 'Păstrează conversațiile în aplicație pentru a avea dovezi'
    }
]

const redFlags = [
    'Prețuri mult sub valoarea de piață',
    'Cereri de plată în avans fără a vedea produsul',
    'Vânzător care evită întâlnirea personală',
    'Presiune pentru a încheia rapid tranzacția',
    'Solicitări de date personale sau bancare',
    'Link-uri externe suspecte'
]

const dosList = [
    'Verifică produsul în persoană înainte de a plăti',
    'Întâlnește-te în locuri publice, de preferință ziua',
    'Informează pe cineva despre întâlnire',
    'Folosește sistemul de mesagerie al platformei',
    'Raportează comportamentul suspect',
    'Păstrează chitanțele și conversațiile'
]

export default function SigurantaPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero with Wave */}
            <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <svg className="absolute w-full h-full">
                        <defs>
                            <pattern id="shield-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                                <path d="M30 5 L50 15 L50 35 L30 55 L10 35 L10 15 Z" fill="none" stroke="white" strokeWidth="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#shield-pattern)"/>
                    </svg>
                </div>
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3"></div>
                
                <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Siguranța pe Vindel</h1>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto">
                        Sfaturi esențiale pentru a avea tranzacții sigure și a evita înșelătoriile
                    </p>
                </div>
                
                <svg className="absolute -bottom-1 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <path fill="#f8fafc" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,53.3C1120,53,1280,75,1360,85.3L1440,96L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
                </svg>
            </div>

            {/* Security Tips */}
            <div className="max-w-5xl mx-auto px-4 py-16">
                <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">Sfaturi de siguranță</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                    {securityTips.map((tip, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-amber-200 transition-all">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                                    <tip.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-1">{tip.title}</h3>
                                    <p className="text-slate-500">{tip.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Do's and Don'ts */}
            <div className="bg-slate-50 border-y border-slate-100">
                <div className="max-w-5xl mx-auto px-4 py-16">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Do's */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-emerald-100">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Ce să faci</h3>
                            </div>
                            <ul className="space-y-3">
                                {dosList.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-600">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Don'ts */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-red-100">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Semnale de alarmă</h3>
                            </div>
                            <ul className="space-y-3">
                                {redFlags.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-600">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Section */}
            <div className="max-w-5xl mx-auto px-4 py-16">
                <div className="bg-gradient-to-r from-[#13C1AC] to-[#0EA89A] rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <svg className="w-full h-full">
                            <defs>
                                <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <circle cx="10" cy="10" r="2" fill="white"/>
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#dots)"/>
                        </svg>
                    </div>
                    <div className="relative">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                            <Flag className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">Raportează activitatea suspectă</h2>
                        <p className="text-white/90 mb-8 max-w-xl mx-auto">
                            Dacă întâlnești un anunț sau comportament suspect, raportează-l imediat. Ajută-ne să menținem platforma sigură pentru toți.
                        </p>
                        <Link 
                            href="/contact"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition-all border border-white/30"
                        >
                            <Phone className="w-5 h-5" />
                            Contactează suportul
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
