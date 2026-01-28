'use client'

import { Search, MessageCircle, ShieldCheck, CreditCard, Package, Users, ChevronRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'

const helpCategories = [
    {
        icon: Package,
        title: 'Publicar anunțuri',
        description: 'Învață cum să publici și gestionezi anunțurile tale',
        link: '/cum-sa-vinzi',
        color: 'from-emerald-500 to-teal-500'
    },
    {
        icon: CreditCard,
        title: 'Cumpărare',
        description: 'Ghid complet pentru a cumpăra în siguranță',
        link: '/cum-sa-cumperi',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        icon: ShieldCheck,
        title: 'Siguranță',
        description: 'Sfaturi pentru tranzacții sigure',
        link: '/siguranta',
        color: 'from-amber-500 to-orange-500'
    },
    {
        icon: MessageCircle,
        title: 'Contact',
        description: 'Contactează echipa de suport',
        link: '/contact',
        color: 'from-purple-500 to-pink-500'
    }
]

const popularQuestions = [
    'Cum pot crea un cont nou?',
    'Cum public un anunț?',
    'Cum contactez un vânzător?',
    'Cum îmi șterg contul?',
    'Cum raportez un anunț suspect?',
    'Cum modific un anunț publicat?'
]

export default function AjutorPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero Section with Waves */}
            <div className="relative bg-gradient-to-r from-[#13C1AC] to-[#0EA89A] overflow-hidden">
                {/* Wave decoration */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="white" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                        <HelpCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Centru de ajutor</h1>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Găsește răspunsuri la întrebările tale și învață cum să folosești platforma Vindu
                    </p>
                    
                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Caută în centrul de ajutor..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white shadow-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-white/30"
                        />
                    </div>
                </div>
                
                {/* Bottom wave */}
                <svg className="absolute -bottom-1 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <path fill="#f8fafc" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
                </svg>
            </div>

            {/* Categories Grid */}
            <div className="max-w-5xl mx-auto px-4 py-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">Categorii de ajutor</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {helpCategories.map((category, index) => (
                        <Link 
                            key={index} 
                            href={category.link}
                            className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-[#13C1AC]/30"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${category.color} text-white group-hover:scale-110 transition-transform`}>
                                    <category.icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-[#13C1AC] transition-colors">{category.title}</h3>
                                    <p className="text-slate-500 mt-1">{category.description}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#13C1AC] group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Popular Questions */}
            <div className="max-w-5xl mx-auto px-4 pb-16">
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-8 border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Întrebări frecvente</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {popularQuestions.map((question, index) => (
                            <button 
                                key={index}
                                className="flex items-center gap-3 text-left p-4 rounded-xl hover:bg-white hover:shadow-md transition-all group"
                            >
                                <span className="w-8 h-8 rounded-full bg-[#13C1AC]/10 flex items-center justify-center text-[#13C1AC] text-sm font-medium group-hover:bg-[#13C1AC] group-hover:text-white transition-colors">
                                    {index + 1}
                                </span>
                                <span className="text-slate-600 group-hover:text-slate-800">{question}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-gradient-to-r from-[#13C1AC]/5 to-[#0EA89A]/5 border-t border-[#13C1AC]/10">
                <div className="max-w-5xl mx-auto px-4 py-12 text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-3">Nu ai găsit ce căutai?</h2>
                    <p className="text-slate-600 mb-6">Echipa noastră de suport este aici să te ajute</p>
                    <Link 
                        href="/contact"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-[#13C1AC] text-white font-medium rounded-xl hover:bg-[#0EA89A] transition-colors shadow-lg shadow-[#13C1AC]/25"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Contactează-ne
                    </Link>
                </div>
            </div>
        </div>
    )
}
