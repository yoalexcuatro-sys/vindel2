'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Save, Globe, Phone, Mail, MapPin } from 'lucide-react';

interface SiteSettings {
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  metaTitle: string;
  metaDescription: string;
  maintenanceMode: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Vindel.ro',
    contactEmail: '',
    contactPhone: '',
    address: '',
    metaTitle: 'Vindel - Anunțuri Gratuite',
    metaDescription: 'Platforma ta preferată de anunțuri din România.',
    maintenanceMode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSettings(snap.data() as SiteSettings);
        }
      } catch (e) {
        console.error("Error fetching settings:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      alert('Setările au fost salvate cu succes!');
    } catch (e) {
        console.error(e);
      alert('Eroare la salvare.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Se încarcă setările...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Setări Platformă</h1>
          <p className="text-gray-500">Configurează detaliile generale ale site-ului SEO și contact.</p>
        </div>
        <button 
            type="submit" 
            form="settings-form"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
        >
            <Save className="w-4 h-4" />
            {saving ? 'Se salvează...' : 'Salvează Modificările'}
        </button>
      </div>

      <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
        {/* General Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b pb-3 mb-4">
                <Globe className="w-5 h-5 text-gray-400" />
                Informații Generale
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Nume Site</label>
                    <input 
                        type="text" 
                        value={settings.siteName}
                        onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Meta Titlu (Homepage)</label>
                    <input 
                        type="text" 
                        value={settings.metaTitle}
                        onChange={(e) => setSettings({...settings, metaTitle: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div className="col-span-full space-y-2">
                    <label className="text-sm font-medium text-gray-700">Meta Descriere (SEO)</label>
                    <textarea 
                        rows={3}
                        value={settings.metaDescription}
                        onChange={(e) => setSettings({...settings, metaDescription: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                </div>
            </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b pb-3 mb-4">
                <Phone className="w-5 h-5 text-gray-400" />
                Informații Contact
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Email Contact
                    </label>
                    <input 
                        type="email" 
                        value={settings.contactEmail}
                        onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Phone className="w-3 h-3" /> Telefon
                    </label>
                    <input 
                        type="tel" 
                        value={settings.contactPhone}
                        onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div className="col-span-full space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Adresa Fizică
                    </label>
                    <input 
                        type="text" 
                        value={settings.address}
                        onChange={(e) => setSettings({...settings, address: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
            </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
            <div>
                <h3 className="font-semibold text-gray-900">Mod Mentenanță</h3>
                <p className="text-sm text-gray-500">Activează pentru a bloca accesul public temporar.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
      </form>
    </div>
  );
}
