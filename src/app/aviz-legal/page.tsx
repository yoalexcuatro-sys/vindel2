'use client';

import { Building2, Mail, Phone, Globe, FileText, Scale } from 'lucide-react';

export default function AvizLegalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#13C1AC] to-teal-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-8 w-8" />
            <h1 className="text-3xl md:text-4xl font-bold">Aviz Legal</h1>
          </div>
          <p className="text-teal-100 text-lg">Informații legale despre Vindel</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Building2 className="h-6 w-6 text-[#13C1AC]" />
              Informații despre Companie
            </h2>
            
            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Denumire</p>
                  <p className="font-semibold text-slate-900">Vindel S.R.L.</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">CUI</p>
                  <p className="font-semibold text-slate-900">RO12345678</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Nr. Reg. Comerțului</p>
                  <p className="font-semibold text-slate-900">J40/1234/2024</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Capital Social</p>
                  <p className="font-semibold text-slate-900">10.000 RON</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Mail className="h-6 w-6 text-[#13C1AC]" />
              Date de Contact
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
                <Building2 className="h-5 w-5 text-[#13C1AC] mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Sediu Social</p>
                  <p className="text-slate-600 text-sm">București, Sector 1<br />Str. Exemplu nr. 123<br />Cod Poștal: 010101</p>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
                <Mail className="h-5 w-5 text-[#13C1AC] mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Email</p>
                  <p className="text-slate-600 text-sm">
                    General: contact@vindel.ro<br />
                    Suport: suport@vindel.ro<br />
                    Legal: legal@vindel.ro
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
                <Phone className="h-5 w-5 text-[#13C1AC] mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Telefon</p>
                  <p className="text-slate-600 text-sm">+40 21 XXX XXXX<br />Luni - Vineri: 09:00 - 18:00</p>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
                <Globe className="h-5 w-5 text-[#13C1AC] mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Website</p>
                  <p className="text-slate-600 text-sm">www.vindel.ro</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <FileText className="h-6 w-6 text-[#13C1AC]" />
              Obiectul de Activitate
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Vindel S.R.L. operează o platformă online de tip marketplace care facilitează 
              tranzacțiile comerciale între utilizatori (vânzători și cumpărători). Compania 
              acționează exclusiv ca intermediar și nu este parte în tranzacțiile efectuate 
              între utilizatori.
            </p>
            <p className="text-slate-600 leading-relaxed mt-4">
              Cod CAEN principal: 6311 - Prelucrarea datelor, administrarea paginilor web și 
              activități conexe
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Proprietate Intelectuală</h2>
            <p className="text-slate-600 leading-relaxed">
              Toate drepturile de proprietate intelectuală asupra platformei Vindel, inclusiv 
              dar fără a se limita la:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mt-4">
              <li>Marca „Vindel" și logo-ul asociat</li>
              <li>Design-ul și interfața platformei</li>
              <li>Codul sursă și software-ul</li>
              <li>Conținutul editorial creat de Vindel</li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-4">
              aparțin exclusiv Vindel S.R.L. și sunt protejate de legislația română și 
              internațională privind drepturile de autor și proprietatea intelectuală.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Limitarea Răspunderii</h2>
            <p className="text-slate-600 leading-relaxed">
              Vindel depune eforturi rezonabile pentru a asigura acuratețea informațiilor 
              de pe platformă, însă nu garantează:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mt-4">
              <li>Exactitatea, completitudinea sau actualitatea conținutului postat de utilizatori</li>
              <li>Disponibilitatea neîntreruptă a serviciilor</li>
              <li>Absența erorilor sau a vulnerabilităților de securitate</li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-4">
              Utilizatorii sunt responsabili pentru verificarea informațiilor și pentru 
              deciziile luate pe baza conținutului de pe platformă.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Legislație Aplicabilă</h2>
            <p className="text-slate-600 leading-relaxed">
              Relația dintre Vindel și utilizatorii săi este guvernată de legislația română. 
              Orice litigiu va fi soluționat de instanțele competente din București, România.
            </p>
            <p className="text-slate-600 leading-relaxed mt-4">
              Vindel respectă prevederile:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mt-2">
              <li>Regulamentul (UE) 2016/679 (GDPR)</li>
              <li>Legea nr. 365/2002 privind comerțul electronic</li>
              <li>Ordonanța nr. 21/1992 privind protecția consumatorilor</li>
              <li>Legea nr. 363/2007 privind combaterea practicilor incorecte</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Soluționarea Alternativă a Litigiilor</h2>
            <p className="text-slate-600 leading-relaxed">
              În conformitate cu Regulamentul (UE) nr. 524/2013, consumatorii pot utiliza 
              platforma europeană de soluționare online a litigiilor (SOL) disponibilă la:
            </p>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mt-4">
              <a 
                href="https://ec.europa.eu/consumers/odr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#13C1AC] hover:underline font-medium"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">ANPC</h2>
            <p className="text-slate-600 leading-relaxed">
              Pentru reclamații privind protecția consumatorilor, vă puteți adresa:
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mt-4">
              <p className="text-slate-700 font-semibold">Autoritatea Națională pentru Protecția Consumatorilor</p>
              <p className="text-slate-600 text-sm mt-2">
                Bd. Aviatorilor nr. 72, Sector 1, București<br />
                Tel: 021 9551<br />
                Website: <a href="https://anpc.ro" target="_blank" rel="noopener" className="text-[#13C1AC] hover:underline">www.anpc.ro</a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
