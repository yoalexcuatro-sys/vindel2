'use client';

import { Shield, Database, Eye, Lock, UserCheck, Globe, Mail, Settings } from 'lucide-react';

export default function ConfidentialitatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#13C1AC] to-teal-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl md:text-4xl font-bold">Politica de Confidențialitate</h1>
          </div>
          <p className="text-teal-100 text-lg">Ultima actualizare: 18 ianuarie 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-10">
            <p className="text-teal-800 m-0">
              La Vindu, protejarea datelor dumneavoastră personale este o prioritate. Această politică explică 
              cum colectăm, utilizăm și protejăm informațiile dumneavoastră în conformitate cu GDPR.
            </p>
          </div>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Database className="h-6 w-6 text-[#13C1AC]" />
              1. Date Colectate
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Colectăm următoarele categorii de date personale:
            </p>
            
            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Date furnizate direct:</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li>Nume și prenume</li>
              <li>Adresă de email</li>
              <li>Număr de telefon</li>
              <li>Adresă (oraș, județ)</li>
              <li>Fotografie de profil</li>
              <li>Informații despre produsele listate</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Date colectate automat:</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li>Adresa IP</li>
              <li>Tipul dispozitivului și browserului</li>
              <li>Paginile vizitate și timpul petrecut</li>
              <li>Date de localizare aproximativă</li>
              <li>Cookie-uri și tehnologii similare</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Eye className="h-6 w-6 text-[#13C1AC]" />
              2. Scopul Prelucrării
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Utilizăm datele dumneavoastră pentru:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li>Crearea și gestionarea contului dumneavoastră</li>
              <li>Facilitarea tranzacțiilor între utilizatori</li>
              <li>Comunicări legate de serviciu (notificări, mesaje)</li>
              <li>Îmbunătățirea și personalizarea experienței</li>
              <li>Prevenirea fraudei și asigurarea securității</li>
              <li>Respectarea obligațiilor legale</li>
              <li>Marketing și comunicări promoționale (cu consimțământ)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Lock className="h-6 w-6 text-[#13C1AC]" />
              3. Baza Legală
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Prelucrăm datele dumneavoastră pe baza:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li><strong>Executarea contractului</strong> - pentru furnizarea serviciilor Platformei</li>
              <li><strong>Consimțământul</strong> - pentru marketing și cookie-uri non-esențiale</li>
              <li><strong>Interesul legitim</strong> - pentru îmbunătățirea serviciilor și prevenirea fraudei</li>
              <li><strong>Obligația legală</strong> - pentru conformitatea cu legislația aplicabilă</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Globe className="h-6 w-6 text-[#13C1AC]" />
              4. Partajarea Datelor
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Datele dumneavoastră pot fi partajate cu:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li><strong>Alți utilizatori</strong> - informațiile din profilul public și anunțuri</li>
              <li><strong>Furnizori de servicii</strong> - hosting, procesare plăți, analiză</li>
              <li><strong>Autorități</strong> - când suntem obligați legal</li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-4">
              <strong>Nu vindem datele dumneavoastră personale către terți.</strong>
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <UserCheck className="h-6 w-6 text-[#13C1AC]" />
              5. Drepturile Dumneavoastră
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Conform GDPR, aveți următoarele drepturi:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Dreptul de acces</h4>
                <p className="text-slate-600 text-sm">Puteți solicita o copie a datelor dumneavoastră</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Dreptul la rectificare</h4>
                <p className="text-slate-600 text-sm">Puteți corecta datele inexacte</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Dreptul la ștergere</h4>
                <p className="text-slate-600 text-sm">Puteți solicita ștergerea datelor</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Dreptul la portabilitate</h4>
                <p className="text-slate-600 text-sm">Puteți primi datele într-un format structurat</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Dreptul de opoziție</h4>
                <p className="text-slate-600 text-sm">Vă puteți opune prelucrării</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Retragerea consimțământului</h4>
                <p className="text-slate-600 text-sm">Oricând, fără a afecta prelucrarea anterioară</p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Settings className="h-6 w-6 text-[#13C1AC]" />
              6. Securitatea Datelor
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Implementăm măsuri tehnice și organizatorice pentru protejarea datelor:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mt-4">
              <li>Criptare SSL/TLS pentru toate comunicările</li>
              <li>Stocarea securizată a parolelor (hashing)</li>
              <li>Acces restricționat la date pe bază de necesitate</li>
              <li>Monitorizare continuă pentru detectarea amenințărilor</li>
              <li>Backup-uri regulate și plan de recuperare</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Păstrarea Datelor</h2>
            <p className="text-slate-600 leading-relaxed">
              Păstrăm datele dumneavoastră atât timp cât este necesar pentru scopurile menționate sau 
              conform cerințelor legale. După ștergerea contului, datele vor fi anonimizate sau șterse 
              în termen de 30 de zile, cu excepția celor necesare pentru obligații legale.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Mail className="h-6 w-6 text-[#13C1AC]" />
              8. Contact DPO
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Pentru exercitarea drepturilor sau întrebări despre datele personale:
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mt-4">
              <p className="text-slate-700"><strong>Responsabil Protecția Datelor:</strong> DPO Vindu</p>
              <p className="text-slate-700"><strong>Email:</strong> dpo@vindu.ro</p>
              <p className="text-slate-700"><strong>Adresă:</strong> București, România</p>
            </div>
            <p className="text-slate-600 leading-relaxed mt-4">
              Aveți dreptul să depuneți o plângere la Autoritatea Națională de Supraveghere a 
              Prelucrării Datelor cu Caracter Personal (ANSPDCP).
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
