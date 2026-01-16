'use client';

import { useState } from 'react';
import { collection, getDocs, updateDoc, doc, writeBatch, getDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Loader2, CheckCircle2, AlertCircle, Database, ArrowLeft, Search, Eye } from 'lucide-react';
import Link from 'next/link';

export default function MigratePage() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number; message: string } | null>(null);
  const [productId, setProductId] = useState('');
  const [productData, setProductData] = useState<any>(null);

  const isAdmin = userProfile?.role === 'admin';

  // Ver datos de un producto específico
  const viewProduct = async () => {
    if (!productId.trim()) return;
    
    setLoading(true);
    setProductData(null);
    
    try {
      const docRef = doc(db, 'products', productId.trim());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProductData({ id: docSnap.id, ...docSnap.data() });
      } else {
        setResult({ success: 0, errors: 1, message: 'Producto no encontrado' });
      }
    } catch (error: any) {
      setResult({ success: 0, errors: 1, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Ver todos los productos con sus campos
  const viewAllProducts = async () => {
    setLoading(true);
    setProductData(null);
    
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        condition: doc.data().condition,
        negotiable: doc.data().negotiable,
        title: doc.data().title?.substring(0, 30),
      }));
      
      setProductData(products);
    } catch (error: any) {
      setResult({ success: 0, errors: 1, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const migrateNegotiable = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      
      let updated = 0;
      let errors = 0;
      
      // Usar batch para actualizaciones masivas (max 500 por batch)
      const batches: any[] = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;
      
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Solo actualizar si no tiene el campo negotiable definido
        if (data.negotiable === undefined) {
          const docRef = doc(db, 'products', docSnap.id);
          currentBatch.update(docRef, { negotiable: false });
          operationCount++;
          updated++;
          
          // Firebase permite max 500 operaciones por batch
          if (operationCount === 500) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
        }
      });
      
      // Agregar el último batch si tiene operaciones
      if (operationCount > 0) {
        batches.push(currentBatch);
      }
      
      // Ejecutar todos los batches
      for (const batch of batches) {
        await batch.commit();
      }
      
      setResult({
        success: updated,
        errors: 0,
        message: `Migración completada: ${updated} productos actualizados con negotiable: false`
      });
      
    } catch (error: any) {
      console.error('Migration error:', error);
      setResult({
        success: 0,
        errors: 1,
        message: `Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const migrateCondition = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      
      let updated = 0;
      
      const batches: any[] = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;
      
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Convertir condition antiguo a nuevo formato
        if (data.condition === 'nou' || data.condition === 'folosit') {
          // Ya está en formato simple, no hacer nada
        } else if (!data.condition) {
          // Si no tiene condition, asignar 'folosit' por defecto
          const docRef = doc(db, 'products', docSnap.id);
          currentBatch.update(docRef, { condition: 'folosit' });
          operationCount++;
          updated++;
          
          if (operationCount === 500) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
        }
      });
      
      if (operationCount > 0) {
        batches.push(currentBatch);
      }
      
      for (const batch of batches) {
        await batch.commit();
      }
      
      setResult({
        success: updated,
        errors: 0,
        message: `Migración completada: ${updated} productos actualizados con condition por defecto`
      });
      
    } catch (error: any) {
      console.error('Migration error:', error);
      setResult({
        success: 0,
        errors: 1,
        message: `Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const migratePublishedAt = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      
      let updated = 0;
      let skipped = 0;
      
      const batches: any[] = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;
      
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Skip if already has publishedAt
        if (data.publishedAt) {
          skipped++;
          return;
        }
        
        const docRef = doc(db, 'products', docSnap.id);
        
        // Use createdAt if exists, otherwise use a date 7 days ago
        let publishedAt: Timestamp;
        if (data.createdAt) {
          publishedAt = data.createdAt;
        } else {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          publishedAt = Timestamp.fromDate(sevenDaysAgo);
        }
        
        currentBatch.update(docRef, { publishedAt });
        operationCount++;
        updated++;
        
        if (operationCount === 500) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
      });
      
      if (operationCount > 0) {
        batches.push(currentBatch);
      }
      
      for (const batch of batches) {
        await batch.commit();
      }
      
      setResult({
        success: updated,
        errors: 0,
        message: `Migración completada: ${updated} productos actualizados cu publishedAt (${skipped} omise)`
      });
      
    } catch (error: any) {
      console.error('Migration error:', error);
      setResult({
        success: 0,
        errors: 1,
        message: `Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800">Acces restricționat</h1>
          <p className="text-gray-500 mt-2">Doar administratorii pot accesa această pagină</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Înapoi la Admin
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-[#13C1AC] to-emerald-500 rounded-2xl flex items-center justify-center">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Migrare Bază de Date</h1>
              <p className="text-gray-500">Actualizează produsele existente</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* View Products */}
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-2">🔍 Vezi date produse</h3>
              <p className="text-gray-500 text-sm mb-4">
                Verifică ce valori au produsele în baza de date
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="ID produs (opțional)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13C1AC] focus:border-transparent"
                />
                <button
                  onClick={viewProduct}
                  disabled={loading || !productId.trim()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={viewAllProducts}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                Vezi toate produsele
              </button>
              
              {productData && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(productData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Migrate Negotiable */}
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-2">1. Adaugă câmp "negotiable"</h3>
              <p className="text-gray-500 text-sm mb-4">
                Setează negotiable: false pentru toate produsele care nu au acest câmp
              </p>
              <button
                onClick={migrateNegotiable}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                Rulează migrarea
              </button>
            </div>

            {/* Migrate Condition */}
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-2">2. Adaugă câmp "condition"</h3>
              <p className="text-gray-500 text-sm mb-4">
                Setează condition: 'folosit' pentru produsele fără acest câmp
              </p>
              <button
                onClick={migrateCondition}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                Rulează migrarea
              </button>
            </div>

            {/* Migrate PublishedAt */}
            <div className="border border-orange-200 rounded-xl p-5 bg-orange-50">
              <h3 className="font-semibold text-gray-800 mb-2">3. Adaugă câmp "publishedAt" ⏱️</h3>
              <p className="text-gray-500 text-sm mb-4">
                Setează data publicării pentru produse. Folosește createdAt dacă există, altfel 7 zile în urmă.
              </p>
              <button
                onClick={migratePublishedAt}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                Rulează migrarea publishedAt
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`mt-6 p-4 rounded-xl ${result.errors > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center gap-3">
                {result.errors > 0 ? (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                )}
                <div>
                  <p className={`font-semibold ${result.errors > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
