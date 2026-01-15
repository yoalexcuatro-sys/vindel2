'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, MapPin, X, ChevronLeft, Check, AlertCircle, Loader2,
  CheckCircle2, Trash2, Plus
} from 'lucide-react';
import { localidades } from '@/data/localidades';
import { useAuth } from '@/lib/auth-context';
import { getProduct, updateProduct, Product } from '@/lib/products-service';
import { uploadImages as uploadProductImages } from '@/lib/r2-storage';
import Image from 'next/image';

const CITIES = localidades.map(loc => `${loc.ciudad}, ${loc.judet}`);

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  
  // Estado del producto original
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  
  // Estados del formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [moneda, setMoneda] = useState<'LEI' | 'EUR'>('LEI');
  const [condicion, setCondicion] = useState<'nou' | 'folosit'>('folosit');
  const [negociable, setNegociable] = useState(false);
  const [ubicacion, setUbicacion] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  // Estados UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Cargar producto
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      try {
        const product = await getProduct(id);
        if (!product) {
          setError('Anunțul nu a fost găsit');
          return;
        }
        
        setOriginalProduct(product);
        setTitulo(product.title || '');
        setDescripcion(product.description || '');
        setPrecio(product.price?.toString() || '');
        setMoneda(product.currency || 'LEI');
        setCondicion((product.condition === 'nou' || product.condition === 'folosit') ? product.condition : 'folosit');
        setNegociable(product.negotiable || false);
        setUbicacion(product.location || '');
        setCitySearch(product.location || '');
        setExistingImages(product.images || []);
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Eroare la încărcarea anunțului');
      } finally {
        setLoadingProduct(false);
      }
    };
    
    loadProduct();
  }, [id]);

  // Verificar permisos
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    
    if (originalProduct && user && originalProduct.sellerId !== user.uid) {
      setError('Nu ai permisiunea de a edita acest anunț');
    }
  }, [user, authLoading, originalProduct, router]);

  // Handlers de imágenes
  const handleAddImages = (files: FileList) => {
    const totalImages = existingImages.length + newImages.length;
    const newFiles = Array.from(files).slice(0, 8 - totalImages);
    setNewImages([...newImages, ...newFiles]);
    
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewPreviews(newPreviews.filter((_, i) => i !== index));
  };

  // Filtrar ciudades
  const filteredCities = CITIES.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  ).slice(0, 8);

  // Validación
  const isValid = titulo.trim().length >= 3 && 
                  descripcion.trim().length >= 10 && 
                  precio && 
                  parseFloat(precio) > 0 &&
                  ubicacion;

  // Submit
  const handleSubmit = async () => {
    if (!isValid || !user || !originalProduct) return;
    
    setLoading(true);
    setError('');

    try {
      // Subir nuevas imágenes si hay
      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        newImageUrls = await uploadProductImages(newImages, user.uid);
      }
      
      // Combinar imágenes existentes con nuevas
      const allImages = [...existingImages, ...newImageUrls];
      
      // Si no hay imágenes, usar placeholder
      const finalImages = allImages.length > 0 ? allImages : ['/placeholder-product.svg'];

      const updateData: Partial<Product> = {
        title: titulo.trim(),
        description: descripcion.trim(),
        price: parseFloat(precio) || 0,
        currency: moneda,
        condition: condicion,
        negotiable: negociable,
        location: ubicacion,
        image: finalImages[0],
        images: finalImages,
      };

      await updateProduct(id, updateData);
      
      setSuccess(true);
      setTimeout(() => router.push('/profile?view=products'), 2000);
    } catch (err: any) {
      console.error('Error updating:', err);
      setError(err.message || 'Eroare la actualizare');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loadingProduct || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#13C1AC] animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Se încarcă anunțul...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !originalProduct) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 shadow-xl max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{error}</h2>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          >
            Înapoi
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 shadow-xl">
          <div className="w-24 h-24 bg-gradient-to-br from-[#13C1AC] to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Actualizat cu succes!</h2>
          <p className="text-gray-500">Redirecționare...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-gray-800 font-semibold text-lg">Editează anunțul</h1>
          <div className="w-6" />
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-lg">
          
          {/* Images Section */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#13C1AC]" />
              Imagini
            </h3>
            
            <div className="grid grid-cols-4 gap-3">
              {/* Existing Images */}
              {existingImages.map((url, index) => (
                <div key={`existing-${index}`} className="aspect-square rounded-xl overflow-hidden relative group">
                  <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                  <button 
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 bg-[#13C1AC] text-white text-xs px-2 py-0.5 rounded-full">
                      Principal
                    </span>
                  )}
                </div>
              ))}
              
              {/* New Images Previews */}
              {newPreviews.map((preview, index) => (
                <div key={`new-${index}`} className="aspect-square rounded-xl overflow-hidden relative group border-2 border-[#13C1AC]">
                  <Image src={preview} alt="" fill className="object-cover" />
                  <button 
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Nouă
                  </span>
                </div>
              ))}
              
              {/* Add Button */}
              {existingImages.length + newImages.length < 8 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#13C1AC] flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <Plus className="w-8 h-8 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Adaugă</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={(e) => e.target.files && handleAddImages(e.target.files)}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Titlu anunț *</label>
              <input 
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="ex: iPhone 14 Pro Max 256GB"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#13C1AC] focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descriere *</label>
              <textarea 
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descrie produsul în detaliu..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#13C1AC] focus:border-transparent resize-none"
              />
            </div>

            {/* Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Preț *</label>
                <input 
                  type="number"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#13C1AC] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monedă</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setMoneda('LEI')}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${moneda === 'LEI' ? 'bg-[#13C1AC] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    LEI
                  </button>
                  <button 
                    onClick={() => setMoneda('EUR')}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${moneda === 'EUR' ? 'bg-[#13C1AC] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    EUR
                  </button>
                </div>
              </div>
            </div>

            {/* Condition & Negotiable */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stare</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCondicion('nou')}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${condicion === 'nou' ? 'bg-[#13C1AC] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Nou
                  </button>
                  <button 
                    onClick={() => setCondicion('folosit')}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${condicion === 'folosit' ? 'bg-[#13C1AC] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Folosit
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Negociabil</label>
                <button 
                  onClick={() => setNegociable(!negociable)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${negociable ? 'bg-[#13C1AC] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {negociable ? '✓ Negociabil' : 'Preț fix'}
                </button>
              </div>
            </div>

            {/* Location */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Locație *
              </label>
              <input 
                type="text"
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                placeholder="Caută orașul..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#13C1AC] focus:border-transparent"
              />
              
              {showCityDropdown && filteredCities.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredCities.map((city, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setUbicacion(city);
                        setCitySearch(city);
                        setShowCityDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <button 
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                isValid && !loading
                  ? 'bg-gradient-to-r from-[#13C1AC] to-teal-500 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Se actualizează...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Salvează modificările
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
