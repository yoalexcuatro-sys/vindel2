import { Home, Briefcase, Smartphone, Shirt, PawPrint } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative mt-8 text-sm overflow-hidden pb-16 md:pb-0">
        {/* Wave Background */}
        <div className="absolute inset-0 z-0">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50/30"></div>
            
            {/* Animated wave layers */}
            <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 600" preserveAspectRatio="none">
                {/* Background wave - most transparent */}
                <path 
                    d="M0,400 C180,350 360,450 540,400 C720,350 900,450 1080,400 C1260,350 1440,400 1440,400 L1440,600 L0,600 Z" 
                    fill="url(#waveGradient1)" 
                    opacity="0.3"
                />
                {/* Middle wave */}
                <path 
                    d="M0,450 C200,400 400,500 600,450 C800,400 1000,480 1200,450 C1400,420 1440,450 1440,450 L1440,600 L0,600 Z" 
                    fill="url(#waveGradient2)" 
                    opacity="0.2"
                />
                {/* Front wave - most visible */}
                <path 
                    d="M0,500 C240,470 480,530 720,500 C960,470 1200,510 1440,500 L1440,600 L0,600 Z" 
                    fill="url(#waveGradient3)" 
                    opacity="0.15"
                />
                
                {/* Gradients definitions */}
                <defs>
                    <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#13C1AC" />
                        <stop offset="50%" stopColor="#0d9488" />
                        <stop offset="100%" stopColor="#13C1AC" />
                    </linearGradient>
                    <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#64748b" />
                        <stop offset="50%" stopColor="#13C1AC" />
                        <stop offset="100%" stopColor="#64748b" />
                    </linearGradient>
                    <linearGradient id="waveGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#13C1AC" />
                        <stop offset="100%" stopColor="#0f766e" />
                    </linearGradient>
                </defs>
            </svg>
            
            {/* Decorative circles */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-slate-400/5 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-teal-400/5 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative z-10 pt-4 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
                
                {/* Column 1: Brand & Desc */}
                <div className="lg:col-span-1">
                    <h3 className="text-2xl font-bold mb-6 tracking-tight"><span className="text-teal-500">Vindel</span><span className="text-slate-700">.ro</span></h3>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        O platformă nouă de anunțuri din România, creată pentru a conecta oamenii într-un mod simplu și sigur. Creștem împreună cu tine.
                    </p>
                    <div className="flex space-x-3">
                        {/* Social Icons */}
                        <SocialButton label="Facebook">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </SocialButton>
                        <SocialButton label="Twitter">
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                        </SocialButton>
                        <SocialButton label="Instagram">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </SocialButton>
                        <SocialButton label="Youtube">
                            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                        </SocialButton>
                    </div>
                </div>

                {/* Column 2: Categories */}
                <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-6">Categorii</h3>
                    <ul className="space-y-3">
                        <CategoryLink icon={Home} label="Imobiliare" category="imobiliare" />
                        <CategoryLink icon={Briefcase} label="Locuri de muncă" category="locuri-de-munca" />
                        <CategoryLink icon={Smartphone} label="Electronice" category="electronice" />
                        <CategoryLink icon={Shirt} label="Modă" category="moda" />
                        <CategoryLink icon={PawPrint} label="Animale" category="animale" />
                    </ul>
                </div>

                {/* Column 3: Help */}
                <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-6">Ajutor</h3>
                    <ul className="space-y-3">
                        <li><HelpLink href="/ajutor">Centru de ajutor</HelpLink></li>
                        <li><HelpLink href="/cum-sa-vinzi">Cum să vinzi</HelpLink></li>
                        <li><HelpLink href="/cum-sa-cumperi">Cum să cumperi</HelpLink></li>
                        <li><HelpLink href="/siguranta">Siguranță</HelpLink></li>
                        <li><HelpLink href="/contact">Contact</HelpLink></li>
                    </ul>
                </div>

                {/* Column 4: Legal */}
                <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-6">Legal</h3>
                    <ul className="space-y-3">
                        <li><HelpLink href="/termeni">Termeni de utilizare</HelpLink></li>
                        <li><HelpLink href="/confidentialitate">Politică de confidențialitate</HelpLink></li>
                        <li><HelpLink href="/cookies">Politică de cookies</HelpLink></li>
                        <li><HelpLink href="/aviz-legal">Aviz legal</HelpLink></li>
                    </ul>
                </div>

                {/* Column 5: Mobile App */}
                <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-6">Aplicație mobilă</h3>
                    <p className="text-slate-500 mb-4 text-sm">Ia-ți anunțurile cu tine</p>
                    <p className="text-[#13C1AC] font-medium text-sm mb-4">🚀 În curând disponibil!</p>
                    <div className="flex flex-row gap-3">
                        <div className="flex-1 bg-slate-200 border border-slate-200 text-slate-400 rounded-lg py-2 px-3 flex items-center justify-center cursor-not-allowed opacity-60">
                            <svg className="h-6 w-6 mr-2 fill-current" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.84 3.44-.74 2.18.17 3.39 1.16 3.96 1.95-3.3 1.97-2.6 7.28 1.48 9.07-.37 1.05-1.16 2.44-2.22 3.45zM12.03 5.39c-.27 2.15-2.14 3.82-3.8 3.58-.62-2.31 1.76-4.59 3.8-3.58z"/></svg> 
                            <span className="font-semibold text-sm">iOS</span>
                        </div>
                        <div className="flex-1 bg-slate-200 border border-slate-200 text-slate-400 rounded-lg py-2 px-3 flex items-center justify-center cursor-not-allowed opacity-60">
                            <svg className="h-6 w-6 mr-2 fill-current" viewBox="0 0 24 24"><path d="M3,20.5V3.5C3,2.91,3.34,2.39,3.84,2.15L13.69,12L3.84,21.85C3.34,21.6,3,21.09,3,20.5M16.81,15.12L6.05,21.34L14.54,12.85M16.81,8.88L14.54,11.15L6.05,2.66M18.59,14.08L19.45,13.58C20.1,13.21 20.1,12.59 19.45,12.22L18.59,11.72L17.75,12.16V13.65"/></svg>
                            <span className="font-semibold text-sm">Android</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="border-t border-slate-200/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs">
                <p>© 2026 Vindel. Toate drepturile rezervate.</p>
                <div className="flex space-x-4 mt-4 md:mt-0">
                    <a href="/confidentialitate" className="hover:text-[#13C1AC] transition-colors">Confidențialitate</a>
                    <a href="/termeni" className="hover:text-[#13C1AC] transition-colors">Termeni</a>
                    <a href="/cookies" className="hover:text-[#13C1AC] transition-colors">Cookies</a>
                </div>
            </div>
        </div>
        </div>
      </footer>
  );
}

// Subcomponents helper
function SocialButton({ children, label }: { children: React.ReactNode, label: string }) {
    return (
        <a href="#" className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#13C1AC] hover:border-[#13C1AC] transition-all" aria-label={label}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {children}
            </svg>
        </a>
    )
}

function CategoryLink({ icon: Icon, label, category }: { icon: any, label: string, category: string }) {
     return (
        <li>
            <a href={`/search?category=${category}`} className="flex items-center text-slate-500 hover:text-[#13C1AC] transition-colors group">
                <Icon className="h-5 w-5 mr-3 text-[#13C1AC]" strokeWidth={1.5} />
                <span>{label}</span>
            </a>
        </li>
     )
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <a href={href} className="text-slate-500 hover:text-[#13C1AC] transition-colors block">
            {children}
        </a>
    )
}

function HelpLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <a href={href} className="group flex items-center text-slate-500 hover:text-[#13C1AC] transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-[#13C1AC]/40 mr-2.5 group-hover:bg-[#13C1AC] group-hover:scale-125 transition-all"></span>
            <span className="group-hover:translate-x-0.5 transition-transform">{children}</span>
        </a>
    )
}
