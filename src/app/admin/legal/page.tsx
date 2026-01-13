'use client';

import React, { useState, useEffect } from 'react';
import { Scale, Download, Search, CheckCircle, ChevronDown, ChevronUp, FileText, Shield, AlertTriangle } from 'lucide-react';

interface ConsentLog {
  id: string;
  userId: string;
  userName?: string;
  type: 'terms_of_service' | 'privacy_policy' | 'marketing_cookies' | 'analytics_cookies';
  version: string;
  ip: string;
  userAgent: string;
  createdAt: any;
}

interface GDPRRequest {
  id: string;
  userId: string;
  userName?: string;
  type: 'export_data' | 'delete_account' | 'rectification';
  status: 'pending' | 'processing' | 'completed';
  createdAt: any;
  dueDate: any;
}

export default function LegalRegistryPage() {
  const [activeTab, setActiveTab] = useState<'consents' | 'requests'>('consents');
  const [consents, setConsents] = useState<ConsentLog[]>([]);
  const [gdprRequests, setGdprRequests] = useState<GDPRRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const userConsents = consents.reduce((acc, consent) => {
    if (!acc[consent.userId]) {
      acc[consent.userId] = { userId: consent.userId, userName: consent.userName, consents: [], lastActivity: consent.createdAt };
    }
    acc[consent.userId].consents.push(consent);
    if (consent.createdAt.seconds > acc[consent.userId].lastActivity.seconds) {
      acc[consent.userId].lastActivity = consent.createdAt;
    }
    return acc;
  }, {} as Record<string, { userId: string; userName?: string; consents: ConsentLog[]; lastActivity: any }>);

  const filteredUsers = Object.values(userConsents).filter(user => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return user.userName?.toLowerCase().includes(q) || user.userId.toLowerCase().includes(q);
  });

  const filteredRequests = gdprRequests.filter(req => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return req.userName?.toLowerCase().includes(q) || req.userId.toLowerCase().includes(q);
  });

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setConsents([
        { id: '1', userId: 'uid_123', userName: 'Alexandru Popescu', type: 'terms_of_service', version: 'v1.2', ip: '192.168.0.1', userAgent: 'Mozilla/5.0 (Mac)', createdAt: { seconds: Date.now() / 1000 } },
        { id: '1b', userId: 'uid_123', userName: 'Alexandru Popescu', type: 'privacy_policy', version: 'v2.0', ip: '192.168.0.1', userAgent: 'Mozilla/5.0 (Mac)', createdAt: { seconds: Date.now() / 1000 } },
        { id: '1c', userId: 'uid_123', userName: 'Alexandru Popescu', type: 'marketing_cookies', version: 'v1.0', ip: '192.168.0.1', userAgent: 'Mozilla/5.0 (Mac)', createdAt: { seconds: Date.now() / 1000 } },
        { id: '2', userId: 'uid_456', userName: 'Maria Ionescu', type: 'marketing_cookies', version: 'v1.0', ip: '86.122.45.12', userAgent: 'Mozilla/5.0 (iPhone)', createdAt: { seconds: (Date.now() / 1000) - 3600 } },
        { id: '3', userId: 'uid_789', userName: 'Ion Doe', type: 'privacy_policy', version: 'v2.0', ip: '10.0.0.5', userAgent: 'Chrome/120 (Windows)', createdAt: { seconds: (Date.now() / 1000) - 86400 } },
        { id: '3b', userId: 'uid_789', userName: 'Ion Doe', type: 'terms_of_service', version: 'v1.2', ip: '10.0.0.5', userAgent: 'Chrome/120 (Windows)', createdAt: { seconds: (Date.now() / 1000) - 86400 } }
      ]);
      setGdprRequests([
        { id: 'req_1', userId: 'uid_999', userName: 'Test User', type: 'export_data', status: 'pending', createdAt: { seconds: (Date.now() / 1000) - 7200 }, dueDate: { seconds: (Date.now() / 1000) + (30 * 24 * 3600) } }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getLabel = (type: string) => {
    if (type === 'terms_of_service') return 'Termeni';
    if (type === 'privacy_policy') return 'Privacy';
    if (type === 'marketing_cookies') return 'Cookies';
    return type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#13C1AC] to-[#0da896] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Registru Legal & GDPR</h1>
              <p className="text-sm text-white/70">Evidența consimțămintelor - Regulament (UE) 2016/679</p>
            </div>
          </div>
          <button className="px-4 py-2.5 bg-white text-[#13C1AC] rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-md">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5 text-blue-600 group-hover:text-white" />
            </div>
            <span className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Termeni</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">v1.2</p>
          <p className="text-xs text-gray-400 mt-1">Ultima actualizare</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-500 transition-colors">
              <Shield className="w-5 h-5 text-purple-600 group-hover:text-white" />
            </div>
            <span className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Privacy</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">v2.0</p>
          <p className="text-xs text-gray-400 mt-1">Ultima actualizare</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-500 transition-colors">
              <AlertTriangle className="w-5 h-5 text-orange-500 group-hover:text-white" />
            </div>
            <span className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Solicitări</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{gdprRequests.length}</p>
          <p className="text-xs text-orange-500 mt-1">Necesită atenție</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all group cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-500 transition-colors">
              <CheckCircle className="w-5 h-5 text-green-600 group-hover:text-white" />
            </div>
            <span className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Utilizatori</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Object.keys(userConsents).length}</p>
          <p className="text-xs text-green-500 mt-1">Cu consimțământ</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b bg-gray-50/80">
          <button 
            onClick={() => setActiveTab('consents')}
            className={`flex-1 py-4 text-sm font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-3 ${activeTab === 'consents' ? 'border-[#13C1AC] text-[#13C1AC] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
          >
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${activeTab === 'consents' ? 'border-[#13C1AC] text-[#13C1AC] bg-[#13C1AC]/10' : 'border-gray-200 text-gray-400'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <span>Consimțăminte ({Object.keys(userConsents).length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-4 text-sm font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-3 ${activeTab === 'requests' ? 'border-[#13C1AC] text-[#13C1AC] bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
          >
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${activeTab === 'requests' ? 'border-[#13C1AC] text-[#13C1AC] bg-[#13C1AC]/10' : 'border-gray-200 text-gray-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span>Solicitări GDPR ({gdprRequests.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută utilizator după nume sau ID..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-56 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent"></div>
            <p className="text-sm text-gray-400">Se încarcă datele...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'consents' ? (
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500 text-xs uppercase border-b">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold tracking-wider">Utilizator</th>
                    <th className="px-6 py-4 text-left font-semibold tracking-wider">Consimțăminte</th>
                    <th className="px-6 py-4 text-left font-semibold tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left font-semibold tracking-wider">Data</th>
                    <th className="px-6 py-4 text-center font-semibold tracking-wider">Detalii</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((userData) => {
                    const hasTerms = userData.consents.some(c => c.type === 'terms_of_service');
                    const hasPrivacy = userData.consents.some(c => c.type === 'privacy_policy');
                    const hasCookies = userData.consents.some(c => c.type === 'marketing_cookies');
                    const count = [hasTerms, hasPrivacy, hasCookies].filter(Boolean).length;
                    const isExpanded = expandedUser === userData.userId;

                    return (
                      <React.Fragment key={userData.userId}>
                        <tr className={`hover:bg-indigo-50/50 transition-colors ${isExpanded ? 'bg-indigo-50/30' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${count === 3 ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' : 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white'}`}>
                                {userData.userName?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{userData.userName}</p>
                                <p className="text-xs text-gray-400 font-mono">{userData.userId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1.5 flex-wrap">
                              {hasTerms && <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">✓ Termeni</span>}
                              {hasPrivacy && <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">✓ Privacy</span>}
                              {hasCookies && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">✓ Cookies</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {count === 3 ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs rounded-full font-semibold border border-green-200">
                                <CheckCircle className="w-3.5 h-3.5" /> Complet
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                {count}/3 acceptate
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(userData.lastActivity.seconds * 1000).toLocaleDateString('ro-RO')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => setExpandedUser(isExpanded ? null : userData.userId)} className={`p-2.5 rounded-xl transition-all ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gradient-to-r from-slate-50 to-indigo-50/30">
                            <td colSpan={5} className="px-6 py-5">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {userData.consents.map((c) => (
                                  <div key={c.id} className={`p-4 rounded-xl border-2 text-xs shadow-sm ${
                                    c.type === 'terms_of_service' ? 'bg-blue-50 border-blue-200' :
                                    c.type === 'privacy_policy' ? 'bg-purple-50 border-purple-200' :
                                    'bg-amber-50 border-amber-200'
                                  }`}>
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="font-bold text-gray-900">{getLabel(c.type)}</span>
                                      <span className="px-2 py-0.5 bg-white rounded text-gray-500 font-mono text-[10px]">{c.version}</span>
                                    </div>
                                    <div className="space-y-2 text-gray-600">
                                      <p className="flex items-center gap-2">
                                        <span className="text-gray-400">📅</span>
                                        {new Date(c.createdAt.seconds * 1000).toLocaleString('ro-RO')}
                                      </p>
                                      <p className="flex items-center gap-2">
                                        <span className="text-gray-400">🌐</span>
                                        <code className="bg-white px-1.5 py-0.5 rounded">{c.ip}</code>
                                      </p>
                                      <p className="flex items-center gap-2 truncate">
                                        <span className="text-gray-400">💻</span>
                                        {c.userAgent}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500 text-xs uppercase border-b">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold tracking-wider">Referință</th>
                    <th className="px-6 py-4 text-left font-semibold tracking-wider">Utilizator</th>
                    <th className="px-6 py-4 text-left font-semibold tracking-wider">Tip Cerere</th>
                    <th className="px-6 py-4 text-left font-semibold tracking-wider">Deadline</th>
                    <th className="px-6 py-4 text-left font-semibold tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right font-semibold tracking-wider">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">#{req.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center text-sm font-bold">
                            {req.userName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{req.userName}</p>
                            <p className="text-xs text-gray-400">{req.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {req.type === 'export_data' && '📦 Portabilitate Date'}
                        {req.type === 'delete_account' && '🗑️ Ștergere Cont'}
                        {req.type === 'rectification' && '✏️ Rectificare'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-red-600 font-bold">
                          {new Date(req.dueDate.seconds * 1000).toLocaleDateString('ro-RO')}
                        </span>
                        <p className="text-[10px] text-gray-400">30 zile GDPR</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-semibold ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : req.status === 'processing' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                          {req.status === 'pending' && '⏳ În Așteptare'}
                          {req.status === 'processing' && '🔄 Se Procesează'}
                          {req.status === 'completed' && '✅ Finalizat'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
                          Procesează →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
