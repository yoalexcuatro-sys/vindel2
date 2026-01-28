'use client';

import { useState } from 'react';
import { Save, Globe, Loader2, AlertCircle, Search, Bot, FileText } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminSEO() {
  const [settings, setSettings] = useState({
    siteName: 'Vindu.ro',
    siteTitleSuffix: 'Anunțuri Gratuite România',
    siteDescription: 'Platforma ta de anunțuri gratuite. Cumpără și vinde rapid și sigur.',
    keywords: 'anunturi, vanzari, cumparari, auto, imobiliare, electronice, romania',
    socialFacebook: 'https://facebook.com/vindu',
    socialInstagram: 'https://instagram.com/vindu',
    contactEmail: 'suport@vindu.ro',
    googleSiteVerification: '',
    allowIndexing: true
  });
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSettings(prev => ({...prev, [e.target.name]: e.target.value}));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
        // Save to a 'settings' collection (singleton document 'general')
        await setDoc(doc(db, 'settings', 'general'), settings);
        
        // Simulate network delay
        await new Promise(r => setTimeout(r, 800));
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
        console.error("Error saving settings", error);
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="relative max-w-4xl">
      {/* Header with waves */}
      <div className="relative bg-gradient-to-r from-slate-50 to-gray-100 -mx-6 lg:-mx-8 -mt-6 lg:-mt-8 px-6 lg:px-8 pt-6 lg:pt-8 pb-16 mb-6 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-16">
            <path fill="white" d="M0,64 C288,89 432,24 720,49 C1008,74 1152,100 1440,64 L1440,120 L0,120 Z"></path>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-12 opacity-50">
            <path fill="white" d="M0,96 C144,80 288,48 432,48 C576,48 720,80 864,80 C1008,80 1152,64 1296,48 L1440,32 L1440,120 L0,120 Z"></path>
          </svg>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-gray-900">Configurări SEO & Platformă</h1>
          <p className="text-gray-500 text-sm mt-1">Gestionează metadatele globale și setările de contact</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* General SEO */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                Informații Generale Site
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nume Site</label>
                  <input 
                    type="text" 
                    name="siteName"
                    value={settings.siteName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sufix Titlu (separator automat "-")</label>
                  <input 
                    type="text" 
                    name="siteTitleSuffix"
                    value={settings.siteTitleSuffix}
                    onChange={handleChange}
                    placeholder="ex: Anunțuri Gratuite România"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descriere (Meta Description)</label>
                  <textarea 
                    name="siteDescription"
                    rows={3}
                    value={settings.siteDescription}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Recomandat: 150-160 caractere.</p>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuvinte Cheie (Keywords)</label>
                  <input 
                    type="text" 
                    name="keywords"
                    value={settings.keywords}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate prin virgulă.</p>
               </div>
            </div>
        </div>

        {/* Google Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-500" />
                Previzualizare Google
             </h2>
             
             <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="max-w-[600px] font-sans">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm text-xs font-bold text-indigo-600">
                            V
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-sm text-[#202124]">vindu.ro</span>
                            <span className="text-xs text-[#5f6368]">https://vindu.ro</span>
                        </div>
                    </div>
                    <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-medium mb-1 truncate">
                        {settings.siteName} {settings.siteTitleSuffix ? `- ${settings.siteTitleSuffix}` : ''}
                    </h3>
                    <p className="text-sm text-[#4d5156] leading-relaxed line-clamp-2">
                        {settings.siteDescription || 'Descrierea site-ului va apărea aici...'}
                    </p>
                </div>
             </div>
        </div>

        {/* Indexing & Crawling */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-green-600" />
                Indexare & Robots
             </h2>
             
             <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                        <span className="block font-medium text-gray-900">Permite Indexare</span>
                        <span className="text-sm text-gray-500">Controlează vizibilitatea pentru motoarele de căutare (meta robots).</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={settings.allowIndexing} 
                            onChange={(e) => setSettings({...settings, allowIndexing: e.target.checked})}
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Search Console Verification Code</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            name="googleSiteVerification"
                            value={settings.googleSiteVerification}
                            onChange={handleChange}
                            placeholder="ex: google-site-verification=..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Introdu codul meta tag complet sau doar ID-ul.</p>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-900">Sitemap URL</p>
                        <p className="text-xs text-blue-700">Link-ul către harta site-ului pentru Google Search Console:</p>
                        <code className="block bg-white px-2 py-1 rounded border border-blue-200 text-xs font-mono text-blue-600 mt-1 select-all">
                            https://vindu.ro/sitemap.xml
                        </code>
                    </div>
                </div>
             </div>
        </div>

        {/* Social & Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contact & Social Media</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                  <input 
                    type="url" 
                    name="socialFacebook"
                    value={settings.socialFacebook}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                  <input 
                    type="url" 
                    name="socialInstagram"
                    value={settings.socialInstagram}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
               </div>

               <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Suport</label>
                  <input 
                    type="email" 
                    name="contactEmail"
                    value={settings.contactEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
               </div>
            </div>
        </div>

        <div className="flex items-center justify-end gap-4">
             {success && (
                 <span className="text-green-600 font-medium animate-fade-in flex items-center gap-1">
                     Setări actualizate!
                 </span>
             )}
            <button 
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {saving ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Se salvează...
                    </>
                ) : (
                    <>
                        <Save className="w-5 h-5" />
                        Salvează Modificările
                    </>
                )}
            </button>
        </div>

      </form>
    </div>
  );
}
