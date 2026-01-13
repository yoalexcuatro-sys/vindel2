'use client';

import { useState } from 'react';
import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Loader2, CheckCircle2, AlertCircle, Database, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MigratePage() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number; message: string } | null>(null);

  const isAdmin = userProfile?.role === 'admin';

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
