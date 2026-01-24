'use client';

import { FileText, Shield, Users, AlertTriangle, Scale, Mail } from 'lucide-react';

export default function TermeniPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#13C1AC] to-teal-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8" />
            <h1 className="text-3xl md:text-4xl font-bold">Termeni și Condiții</h1>
          </div>
          <p className="text-teal-100 text-lg">Ultima actualizare: 18 ianuarie 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Scale className="h-6 w-6 text-[#13C1AC]" />
              1. Acceptarea Termenilor
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Prin accesarea și utilizarea platformei Vindel („Platforma"), acceptați să fiți obligat de acești Termeni și Condiții. 
              Dacă nu sunteți de acord cu oricare dintre acești termeni, vă rugăm să nu utilizați Platforma.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Users className="h-6 w-6 text-[#13C1AC]" />
              2. Eligibilitate și Conturi
            </h2>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li>Trebuie să aveți cel puțin 18 ani pentru a utiliza Platforma</li>
              <li>Informațiile furnizate trebuie să fie exacte și actualizate</li>
              <li>Sunteți responsabil pentru securitatea contului dumneavoastră</li>
              <li>Un utilizator poate avea un singur cont activ</li>
              <li>Conturile comerciale necesită verificare suplimentară</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-[#13C1AC]" />
              3. Reguli de Utilizare
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Utilizatorii se angajează să respecte următoarele reguli:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li>Nu postați conținut ilegal, fraudulos sau înșelător</li>
              <li>Nu utilizați Platforma pentru spam sau publicitate nesolicitată</li>
              <li>Respectați drepturile de proprietate intelectuală ale altora</li>
              <li>Nu încercați să manipulați sistemul de evaluări</li>
              <li>Tratați alți utilizatori cu respect și profesionalism</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Anunțuri și Tranzacții</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Vindel acționează ca intermediar între vânzători și cumpărători. Nu suntem parte în tranzacțiile efectuate între utilizatori.
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li>Vânzătorii sunt responsabili pentru acuratețea descrierilor produselor</li>
              <li>Prețurile trebuie să fie reale și să includă toate costurile</li>
              <li>Produsele interzise nu pot fi listate pe Platformă</li>
              <li>Vindel își rezervă dreptul de a elimina orice anunț care încalcă regulile</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Produse Interzise</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Următoarele categorii de produse sunt strict interzise:
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="list-disc list-inside text-red-700 space-y-1">
                <li>Arme și muniții</li>
                <li>Droguri și substanțe ilegale</li>
                <li>Produse contrafăcute</li>
                <li>Produse furate</li>
                <li>Materiale pentru adulți</li>
                <li>Animale sălbatice protejate</li>
                <li>Produse periculoase fără certificare</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <AlertTriangle className="h-6 w-6 text-[#13C1AC]" />
              6. Limitarea Răspunderii
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Vindel nu este responsabil pentru:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mt-2">
              <li>Calitatea sau autenticitatea produselor listate</li>
              <li>Comportamentul utilizatorilor pe sau în afara Platformei</li>
              <li>Pierderi rezultate din tranzacții între utilizatori</li>
              <li>Întreruperi temporare ale serviciului</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Proprietate Intelectuală</h2>
            <p className="text-slate-600 leading-relaxed">
              Toate drepturile de proprietate intelectuală asupra Platformei și conținutului său (logo, design, cod sursă) 
              aparțin Vindel. Utilizatorii acordă Vindel o licență non-exclusivă pentru a utiliza conținutul postat în 
              scopul operării Platformei.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Suspendarea Contului</h2>
            <p className="text-slate-600 leading-relaxed">
              Vindel își rezervă dreptul de a suspenda sau închide conturi care:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mt-2">
              <li>Încalcă acești Termeni și Condiții</li>
              <li>Sunt implicate în activități frauduloase</li>
              <li>Primesc multiple reclamații de la alți utilizatori</li>
              <li>Încearcă să ocolească sistemele de securitate</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Modificări ale Termenilor</h2>
            <p className="text-slate-600 leading-relaxed">
              Ne rezervăm dreptul de a modifica acești Termeni în orice moment. Modificările vor fi comunicate 
              prin email și/sau notificare pe Platformă. Continuarea utilizării Platformei după notificare 
              constituie acceptarea noilor termeni.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Mail className="h-6 w-6 text-[#13C1AC]" />
              10. Contact
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Pentru întrebări despre acești Termeni și Condiții, ne puteți contacta la:
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mt-4">
              <p className="text-slate-700"><strong>Email:</strong> legal@vindel.ro</p>
              <p className="text-slate-700"><strong>Adresă:</strong> București, România</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
