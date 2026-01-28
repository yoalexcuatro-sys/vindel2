'use client';

import { Cookie, Settings, BarChart3, Target, Shield, ToggleLeft } from 'lucide-react';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#13C1AC] to-teal-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="h-8 w-8" />
            <h1 className="text-3xl md:text-4xl font-bold">Politica de Cookies</h1>
          </div>
          <p className="text-teal-100 text-lg">Ultima actualizare: 18 ianuarie 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Ce sunt cookie-urile?</h2>
            <p className="text-slate-600 leading-relaxed">
              Cookie-urile sunt fișiere text mici stocate pe dispozitivul dumneavoastră când vizitați un site web. 
              Acestea permit site-ului să vă recunoască și să rețină informații despre vizita dumneavoastră, 
              cum ar fi preferințele de limbă și alte setări.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Settings className="h-6 w-6 text-[#13C1AC]" />
              Tipuri de Cookie-uri Utilizate
            </h2>

            {/* Essential Cookies */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800 m-0">Cookie-uri Esențiale</h3>
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Obligatorii</span>
              </div>
              <p className="text-green-700 text-sm mb-3">
                Necesare pentru funcționarea de bază a site-ului. Nu pot fi dezactivate.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-green-800">
                    <th className="pb-2">Nume</th>
                    <th className="pb-2">Scop</th>
                    <th className="pb-2">Durată</th>
                  </tr>
                </thead>
                <tbody className="text-green-700">
                  <tr>
                    <td className="py-1">session_id</td>
                    <td>Menține sesiunea utilizatorului</td>
                    <td>Sesiune</td>
                  </tr>
                  <tr>
                    <td className="py-1">auth_token</td>
                    <td>Autentificare</td>
                    <td>30 zile</td>
                  </tr>
                  <tr>
                    <td className="py-1">csrf_token</td>
                    <td>Securitate</td>
                    <td>Sesiune</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Analytics Cookies */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800 m-0">Cookie-uri de Analiză</h3>
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Opționale</span>
              </div>
              <p className="text-blue-700 text-sm mb-3">
                Ne ajută să înțelegem cum utilizatorii interacționează cu site-ul pentru a-l îmbunătăți.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-blue-800">
                    <th className="pb-2">Nume</th>
                    <th className="pb-2">Furnizor</th>
                    <th className="pb-2">Durată</th>
                  </tr>
                </thead>
                <tbody className="text-blue-700">
                  <tr>
                    <td className="py-1">_ga</td>
                    <td>Google Analytics</td>
                    <td>2 ani</td>
                  </tr>
                  <tr>
                    <td className="py-1">_gid</td>
                    <td>Google Analytics</td>
                    <td>24 ore</td>
                  </tr>
                  <tr>
                    <td className="py-1">_gat</td>
                    <td>Google Analytics</td>
                    <td>1 minut</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Marketing Cookies */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-800 m-0">Cookie-uri de Marketing</h3>
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">Opționale</span>
              </div>
              <p className="text-purple-700 text-sm mb-3">
                Utilizate pentru a vă afișa reclame relevante pe alte site-uri.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-purple-800">
                    <th className="pb-2">Nume</th>
                    <th className="pb-2">Furnizor</th>
                    <th className="pb-2">Durată</th>
                  </tr>
                </thead>
                <tbody className="text-purple-700">
                  <tr>
                    <td className="py-1">_fbp</td>
                    <td>Facebook</td>
                    <td>3 luni</td>
                  </tr>
                  <tr>
                    <td className="py-1">fr</td>
                    <td>Facebook</td>
                    <td>3 luni</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Functional Cookies */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <ToggleLeft className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-800 m-0">Cookie-uri Funcționale</h3>
                <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded">Opționale</span>
              </div>
              <p className="text-orange-700 text-sm mb-3">
                Permit funcționalități îmbunătățite și personalizare.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-orange-800">
                    <th className="pb-2">Nume</th>
                    <th className="pb-2">Scop</th>
                    <th className="pb-2">Durată</th>
                  </tr>
                </thead>
                <tbody className="text-orange-700">
                  <tr>
                    <td className="py-1">language</td>
                    <td>Preferința de limbă</td>
                    <td>1 an</td>
                  </tr>
                  <tr>
                    <td className="py-1">theme</td>
                    <td>Tema vizuală preferată</td>
                    <td>1 an</td>
                  </tr>
                  <tr>
                    <td className="py-1">recent_searches</td>
                    <td>Căutări recente</td>
                    <td>30 zile</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Cum să Gestionați Cookie-urile</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Puteți controla și șterge cookie-urile în mai multe moduri:
            </p>
            
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">🌐 Setările Browserului</h4>
                <p className="text-slate-600 text-sm">
                  Majoritatea browserelor vă permit să refuzați sau să ștergeți cookie-urile. 
                  Accesați setările browserului dumneavoastră pentru a gestiona preferințele.
                </p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">⚙️ Banner-ul de Cookie-uri</h4>
                <p className="text-slate-600 text-sm">
                  La prima vizită, puteți selecta ce categorii de cookie-uri acceptați prin 
                  banner-ul afișat în partea de jos a ecranului.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">🔗 Linkuri Utile</h4>
                <ul className="text-slate-600 text-sm space-y-1">
                  <li>• <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener" className="text-[#13C1AC] hover:underline">Chrome</a></li>
                  <li>• <a href="https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener" className="text-[#13C1AC] hover:underline">Firefox</a></li>
                  <li>• <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener" className="text-[#13C1AC] hover:underline">Safari</a></li>
                  <li>• <a href="https://support.microsoft.com/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank" rel="noopener" className="text-[#13C1AC] hover:underline">Edge</a></li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Modificări ale Politicii</h2>
            <p className="text-slate-600 leading-relaxed">
              Putem actualiza această politică de cookies periodic. Vă încurajăm să verificați 
              această pagină în mod regulat pentru a fi la curent cu eventualele modificări.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              Pentru întrebări despre utilizarea cookie-urilor, ne puteți contacta la:
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mt-4">
              <p className="text-slate-700"><strong>Email:</strong> privacy@vindu.ro</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
