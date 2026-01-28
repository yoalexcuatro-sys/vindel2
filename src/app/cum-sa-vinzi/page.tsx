'use client'

import { Camera, FileText, Tag, MessageSquare, CheckCircle2, AlertCircle, ArrowRight, Package } from 'lucide-react'
import Link from 'next/link'

const steps = [
    {
        icon: Camera,
        title: 'Fotografiază produsul',
        description: 'Fă fotografii clare din mai multe unghiuri. O imagine bună crește șansele de vânzare cu 60%.',
        tips: ['Folosește lumină naturală', 'Arată detaliile importante', 'Minimum 3 fotografii']
    },
    {
        icon: FileText,
        title: 'Scrie descrierea',
        description: 'O descriere detaliată ajută cumpărătorii să înțeleagă exact ce oferi.',
        tips: ['Menționează starea produsului', 'Include dimensiunile', 'Specifică ce este inclus']
    },
    {
        icon: Tag,
        title: 'Stabilește prețul',
        description: 'Cercetează piața și stabilește un preț competitiv pentru produsul tău.',
        tips: ['Verifică prețuri similare', 'Lasă loc de negociere', 'Fii realist']
    },
    {
        icon: MessageSquare,
        title: 'Răspunde rapid',
        description: 'Cumpărătorii preferă vânzătorii care răspund prompt la mesaje.',
        tips: ['Răspunde în maxim 24h', 'Fii politicos și clar', 'Oferă informații complete']
    }
]

export default function CumSaVinziPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero with Wave */}
            <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 overflow-hidden">
                <div className="absolute inset-0">
                    <svg className="absolute w-full h-full" preserveAspectRatio="none">
                        <defs>
                            <pattern id="wave-pattern" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
                                <path d="M0 10 Q25 0 50 10 T100 10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#wave-pattern)"/>
                    </svg>
                </div>
                <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-10 left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                
                <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Cum să vinzi pe Vindu</h1>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto">
                        Ghid complet pentru a-ți vinde produsele rapid și în siguranță
                    </p>
                </div>
                
                <svg className="absolute -bottom-1 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
                    <path fill="#f8fafc" d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,53.3C840,53,960,75,1080,80C1200,85,1320,75,1380,69.3L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
                </svg>
            </div>

            {/* Steps */}
            <div className="max-w-5xl mx-auto px-4 py-16">
                <h2 className="text-2xl font-bold text-slate-800 mb-12 text-center">4 pași simpli pentru a vinde</h2>
                
                <div className="space-y-8">
                    {steps.map((step, index) => (
                        <div key={index} className="flex gap-6 items-start">
                            <div className="flex-shrink-0">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#13C1AC] to-[#0EA89A] flex items-center justify-center text-white shadow-lg shadow-[#13C1AC]/25">
                                    <step.icon className="w-7 h-7" />
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="w-0.5 h-16 bg-gradient-to-b from-[#13C1AC] to-transparent mx-auto mt-2"></div>
                                )}
                            </div>
                            <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-[#13C1AC]/20 transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-sm font-medium text-[#13C1AC] bg-[#13C1AC]/10 px-3 py-1 rounded-full">Pasul {index + 1}</span>
                                    <h3 className="text-xl font-semibold text-slate-800">{step.title}</h3>
                                </div>
                                <p className="text-slate-600 mb-4">{step.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {step.tips.map((tip, tipIndex) => (
                                        <span key={tipIndex} className="inline-flex items-center gap-1 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                                            <CheckCircle2 className="w-4 h-4 text-[#13C1AC]" />
                                            {tip}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tips Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-y border-amber-100">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-amber-100">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Sfaturi importante</h3>
                            <ul className="space-y-2 text-slate-600">
                                <li className="flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4 text-amber-500" />
                                    Nu partaja date personale sensibile în anunț
                                </li>
                                <li className="flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4 text-amber-500" />
                                    Preferă întâlnirile în locuri publice pentru predarea produsului
                                </li>
                                <li className="flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4 text-amber-500" />
                                    Verifică identitatea cumpărătorului înainte de a încheia tranzacția
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="max-w-5xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Ești gata să vinzi?</h2>
                <p className="text-slate-600 mb-8">Publică primul tău anunț gratuit în mai puțin de 2 minute</p>
                <Link 
                    href="/publish"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#13C1AC] to-[#0EA89A] text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-[#13C1AC]/25 transition-all transform hover:scale-105"
                >
                    <Package className="w-5 h-5" />
                    Publică anunț gratuit
                </Link>
            </div>
        </div>
    )
}
