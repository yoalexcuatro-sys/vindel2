'use client';

import { Heart, Share2, Eye, Flag, MessageCircle, MapPin, ShieldCheck, ChevronLeft, ChevronRight, Tag, Gauge, Ruler, Calendar, Hash, Car, CircleDot, Package, Settings, Zap, Thermometer, Clock, CheckCircle, Info, X, Home, Bed, Bath, Building, Sofa, Waves, ParkingCircle, Trees, Star, Sparkles, AlertTriangle, Truck, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, memo } from 'react';
import { getProduct, getProducts, Product } from '@/lib/products-service';
import { createOrGetConversation } from '@/lib/messages';
import { extractIdFromSlug } from '@/lib/slugs';
import Avatar from '@/components/Avatar';

// Lazy load ProductCard solo cuando hay productos del vendedor
const ProductCard = dynamic(() => import('@/components/ProductCard'), {
  ssr: true
});

// Helper para obtener info de condición
const getConditionInfo = (condition?: string): { label: string; color: string; icon: any } | null => {
  if (!condition) return null;
  const conditions: Record<string, { label: string; color: string; icon: any }> = {
    // Valores antiguos (compatibilidad)
    'new': { label: 'Nou', color: 'bg-emerald-500 text-white', icon: Star },
    'like-new': { label: 'Ca nou', color: 'bg-cyan-500 text-white', icon: Sparkles },
    'good': { label: 'Bună stare', color: 'bg-blue-500 text-white', icon: CheckCircle },
    'fair': { label: 'Folosit', color: 'bg-gray-500 text-white', icon: CheckCircle },
    // Electronice / Gaming
    'nou-sigilat': { label: 'Sigilat', color: 'bg-emerald-500 text-white', icon: Package },
    'nou-desigilat': { label: 'Nou', color: 'bg-blue-500 text-white', icon: Star },
    'ca-nou': { label: 'Ca nou', color: 'bg-cyan-500 text-white', icon: Sparkles },
    'folosit-functional': { label: 'Folosit', color: 'bg-gray-500 text-white', icon: CheckCircle },
    'defect': { label: 'Defect', color: 'bg-orange-500 text-white', icon: AlertTriangle },
    // General
    'nou': { label: 'Nou', color: 'bg-emerald-500 text-white', icon: Star },
    'folosit': { label: 'Folosit', color: 'bg-gray-500 text-white', icon: CheckCircle },
    // Auto-moto
    'accidentat': { label: 'Accidentat', color: 'bg-red-500 text-white', icon: AlertTriangle },
    'pentru-piese': { label: 'Pentru piese', color: 'bg-orange-500 text-white', icon: AlertTriangle },
    // Modă / Copii
    'nou-eticheta': { label: 'Nou cu etichetă', color: 'bg-emerald-500 text-white', icon: Package },
    'nou-fara-eticheta': { label: 'Nou', color: 'bg-blue-500 text-white', icon: Star },
    'vintage': { label: 'Vintage', color: 'bg-amber-600 text-white', icon: Clock },
    // Casă & Grădină
    'renovat': { label: 'Recondiționat', color: 'bg-indigo-500 text-white', icon: Sparkles },
    // Animale
    'disponibil': { label: 'Disponibil', color: 'bg-green-500 text-white', icon: CheckCircle },
    'rezervat': { label: 'Rezervat', color: 'bg-yellow-500 text-white', icon: Clock },
  };
  return conditions[condition] || null;
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Precargar imágenes en background para cambio instantáneo
  useEffect(() => {
    if (product && product.images && product.images.length > 1) {
      // Precargar resto de imágenes después de 100ms
      const timer = setTimeout(() => {
        product.images.slice(1).forEach((url) => {
          const img = new window.Image();
          img.src = url;
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [product]);

  useEffect(() => {
    // Force scroll to top when entering the page to ensure full visibility
    window.scrollTo({ top: 0, behavior: 'instant' });

    async function loadProduct() {
      try {
        if (params?.id) {
          const productId = extractIdFromSlug(params.id as string);
          const foundProduct = await getProduct(productId);
          if (foundProduct) {
            setProduct(foundProduct);
            
            // Dynamic Title for SEO & UX
            document.title = `${foundProduct.title} | Vindel`;

            // Obtener otros productos del mismo vendedor (en paralelo, no bloquea)
            getProducts({ sellerId: foundProduct.sellerId }, 6).then(sellerResult => {
              const otherProducts = sellerResult.products.filter(p => p.id !== foundProduct.id).slice(0, 5);
              setSellerProducts(otherProducts);
            });
          }
        }
      } catch (e) {
        console.error("Error loading product", e);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [params?.id]);

  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="relative w-20 h-20">
                {/* Background Ring */}
                <div className="absolute inset-0 border-[6px] border-blue-50/80 rounded-full"></div>
                {/* Spinning Segment */}
                <div className="absolute inset-0 border-[6px] border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Tag className="w-8 h-8 text-[#3B82F6]" style={{ transform: 'rotate(-45deg)' }} />
                </div>
            </div>
            <p className="mt-6 text-slate-400 text-lg font-medium animate-pulse">Se încarcă...</p>
        </div>
    );
  }

  if (!product) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Anunț negăsit</h1>
            <Link href="/" className="text-[#13C1AC] hover:underline">
                Înapoi la pagina principală
            </Link>
        </div>
    );
  }

  const images = product ? (product.images && product.images.length > 0 ? product.images : [product.image]) : [];

  const nextImage = () => {
    const newIndex = (currentImageIndex + 1) % images.length;
    console.log('Next image:', currentImageIndex, '->', newIndex);
    setCurrentImageIndex(newIndex);
  };

  const prevImage = () => {
    const newIndex = (currentImageIndex - 1 + images.length) % images.length;
    console.log('Prev image:', currentImageIndex, '->', newIndex);
    setCurrentImageIndex(newIndex);
  };

  // Debug log
  console.log('Current image index:', currentImageIndex, 'Total images:', images.length, 'Current URL:', images[currentImageIndex]);

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#13C1AC]">Acasă</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Images & Description */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Image Gallery - Simple and Fast */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* Main Image Container */}
                  <div 
                      className="relative h-[400px] md:h-[500px] bg-gray-100 flex items-center justify-center group cursor-pointer"
                      onClick={() => setLightboxOpen(true)}
                  >
                      {/* All images preloaded, show/hide for instant switching */}
                      {images.map((img, idx) => (
                        <Image 
                          key={idx}
                          src={img} 
                          alt={product.title} 
                          fill
                          sizes="(max-width: 1024px) 100vw, 66vw"
                          className="object-contain"
                          style={{ display: idx === currentImageIndex ? 'block' : 'none' }}
                          priority={idx === 0}
                          quality={75}
                        />
                      ))}
                      
                      {/* Image counter */}
                      <div className="absolute top-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-lg backdrop-blur-md font-medium z-10">
                          {currentImageIndex + 1}/{images.length}
                      </div>
                      
                      {images.length > 1 && (
                        <>
                          <button 
                              onClick={(e) => { e.stopPropagation(); prevImage(); }}
                              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white hover:bg-gray-100 rounded-full text-gray-800 shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                          >
                              <ChevronLeft className="h-6 w-6" />
                          </button>
                          <button 
                              onClick={(e) => { e.stopPropagation(); nextImage(); }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white hover:bg-gray-100 rounded-full text-gray-800 shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                          >
                              <ChevronRight className="h-6 w-6" />
                          </button>
                        </>
                      )}

                      <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <button 
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-white/90 hover:bg-white rounded-full text-gray-600 shadow-md transition-colors"
                        >
                            <Heart className="h-5 w-5" />
                        </button>
                        <button 
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-white/90 hover:bg-white rounded-full text-gray-600 shadow-md transition-colors"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md flex items-center z-10">
                          <Eye className="h-3 w-3 mr-1" />
                          {product.views || 0}
                      </div>
                  </div>

                  {/* Thumbnails - click or hover to change instantly */}
                  {images.length > 1 && (
                    <div className="flex gap-1.5 p-2 bg-gray-50 border-t border-gray-100 overflow-x-auto">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          onMouseEnter={() => setCurrentImageIndex(idx)}
                          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                            currentImageIndex === idx 
                              ? 'border-[#13C1AC] ring-2 ring-[#13C1AC]/20' 
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <Image 
                            src={img} 
                            alt={`Miniatura ${idx + 1}`} 
                            fill
                            sizes="64px"
                            className="object-cover"
                            quality={50}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                     <h2 className="description-text text-xl font-semibold text-gray-900 mb-4">Descriere</h2>
                     <p className="description-text text-gray-600 whitespace-pre-line leading-relaxed">
                        {product.description}
                     </p>
                     
                     {/* Separator and footer */}
                     <div className="mt-8 border-t border-gray-100 pt-5 flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-400">
                           <span>Ref: {product.id.toString().slice(0, 8)}</span>
                           <span className="mx-2">•</span>
                           <button className="flex items-center hover:text-red-500 transition-colors">
                              <Flag className="h-3.5 w-3.5 mr-1" /> Raportează anunțul
                           </button>
                        </div>
                        <span className="text-[10px] text-emerald-500 font-medium border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Activ
                        </span>
                     </div>
                </div>

                {/* Detalii / Caracteristici Card */}
                {product.customFields && Object.keys(product.customFields).length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden description-text text-[0.9rem]">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#13C1AC] to-emerald-500 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-[0.95rem] font-semibold text-gray-900">
                        {product.subcategory || 'Detalii produs'}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {Object.entries(product.customFields)
                        .sort(([keyA], [keyB]) => {
                          // Ordenar: marca primero, luego model, después el resto
                          const order = ['marca', 'marcaAnvelopa', 'marcaJanta', 'model', 'tip', 'tipMoto', 'tipAnvelopa', 'tipJanta'];
                          const indexA = order.indexOf(keyA);
                          const indexB = order.indexOf(keyB);
                          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                          if (indexA !== -1) return -1;
                          if (indexB !== -1) return 1;
                          return 0;
                        })
                        .map(([key, value], idx, arr) => {
                        // Mapeo de IDs a etiquetas legibles
                        const fieldLabels: Record<string, string> = {
                          // Auto
                          'marca': 'Marcă',
                          'model': 'Model',
                          'anFabricatie': 'An fabricație',
                          'km': 'Kilometraj',
                          'combustibil': 'Combustibil',
                          'capacitate': 'Capacitate cilindrică',
                          'putere': 'Putere',
                          'cutie': 'Cutie de viteze',
                          'tractiune': 'Tracțiune',
                          'caroserie': 'Caroserie',
                          'culoare': 'Culoare',
                          'nrUsi': 'Număr uși',
                          'normaEuro': 'Normă poluare',
                          'vin': 'Serie șasiu (VIN)',
                          'inmatriculat': 'Înmatriculat RO',
                          'serviceBook': 'Carte service',
                          'primaInmatriculare': 'Prima înmatriculare',
                          'stareTehnica': 'Stare tehnică',
                          // Moto
                          'tipMoto': 'Tip',
                          // Anvelope
                          'tipAnvelopa': 'Tip anvelopă',
                          'marcaAnvelopa': 'Marcă',
                          'latime': 'Lățime',
                          'inaltime': 'Înălțime profil',
                          'diametru': 'Diametru jantă',
                          'dimensiuneCompleta': 'Dimensiune',
                          'indiceIncarcatura': 'Indice încărcătură',
                          'indiceViteza': 'Indice viteză',
                          'dotAnvelopa': 'DOT',
                          'uzura': 'Uzură',
                          'bucati': 'Bucăți',
                          'runflat': 'Run Flat',
                          'ranforsat': 'Ranforsat',
                          'tipVehicul': 'Tip vehicul',
                          // Jante
                          'tipJanta': 'Tip jantă',
                          'marcaJanta': 'Marcă jantă',
                          'diametruJanta': 'Diametru',
                          'latimeJanta': 'Lățime',
                          'et': 'ET (Offset)',
                          'pcd': 'PCD (găuri)',
                          'diametruCentral': 'Diametru central',
                          'stareJanta': 'Stare',
                          'bucatiJante': 'Bucăți',
                          'cuAnvelope': 'Cu anvelope',
                          'marcaAuto': 'Marcă auto',
                          'modelCompatibil': 'Modele compatibile',
                          // Piese
                          'categoriePiesa': 'Categorie',
                          'tipPiesa': 'Tip piesă',
                          'compatibilitate': 'Compatibilitate',
                          'modelAuto': 'Model auto',
                          'codPiesa': 'Cod piesă / OEM',
                          'garantie': 'Garanție',
                          'producator': 'Producător',
                          // Imobiliare
                          'tipProprietate': 'Tip proprietate',
                          'camere': 'Număr camere',
                          'suprafata': 'Suprafață',
                          'etaj': 'Etaj',
                          'anConstructie': 'An construcție',
                          'mobilat': 'Mobilat',
                          'bai': 'Băi',
                          'parcare': 'Parcare',
                          'perioadaInchiriere': 'Perioadă',
                          'perioadaMinima': 'Perioadă minimă',
                          'tipCamera': 'Tip cameră',
                          'baieProprie': 'Baie proprie',
                          // Telefoane
                          'stareEcran': 'Stare ecran',
                          'stareBaterie': 'Stare baterie',
                          'memorieInterna': 'Memorie internă',
                          'memorieRAM': 'Memorie RAM',
                          'reteleMobile': 'Rețele mobile',
                          'incarcatorOriginal': 'Încărcător original',
                          'cutieOriginala': 'Cutie originală',
                          'durataBaterie': 'Durată baterie',
                          // Electronice
                          'diagonala': 'Diagonală',
                          'rezolutie': 'Rezoluție',
                          'tipDisplay': 'Tip display',
                          'procesor': 'Procesor',
                          'placaVideo': 'Placă video',
                          'stocare': 'Stocare',
                          'tipStorare': 'Tip stocare',
                          // PC Gaming - General
                          'tip': 'Tip produs',
                          'tipPC': 'Tip produs',
                          'specificatii': 'Specificații',
                          'componenta': 'Componentă',
                          // PC Complet
                          'procesorPC': 'Procesor',
                          'placaVideoPC': 'Placă video',
                          'ramPC': 'RAM',
                          'stocarePC': 'Stocare',
                          'placaBazaPC': 'Placă de bază',
                          'sursaPC': 'Sursa',
                          'carcasaPC': 'Carcasă',
                          // GPU
                          'marcaGPU': 'Marcă GPU',
                          'modelGPU': 'Model GPU',
                          'producatorGPU': 'Producător',
                          'vramGPU': 'VRAM',
                          'tipVRAM': 'Tip VRAM',
                          // CPU
                          'marcaCPU': 'Marcă CPU',
                          'modelCPU': 'Model CPU',
                          'generatie': 'Generație',
                          'nuclee': 'Nuclee/Fire',
                          'frecventa': 'Frecvență',
                          'socket': 'Socket',
                          'coolerInclus': 'Cooler inclus',
                          // Motherboard
                          'producatorMB': 'Producător',
                          'modelMB': 'Model',
                          'socketMB': 'Socket',
                          'chipset': 'Chipset',
                          'formatMB': 'Format',
                          'sloturiRAM': 'Sloturi RAM',
                          'tipRAM': 'Tip RAM suportat',
                          // RAM
                          'marcaRAM': 'Marcă RAM',
                          'modelRAM': 'Model RAM',
                          'capacitateRAM': 'Capacitate',
                          'configuratie': 'Configurație',
                          'tipRAMkit': 'Tip RAM',
                          'frecventaRAM': 'Frecvență',
                          'latenta': 'Latență (CL)',
                          // SSD
                          'marcaSSD': 'Marcă SSD',
                          'modelSSD': 'Model SSD',
                          'capacitateSSD': 'Capacitate',
                          'tipSSD': 'Tip SSD',
                          'vitezaCitire': 'Viteză citire',
                          'vitezaScriere': 'Viteză scriere',
                          // HDD
                          'marcaHDD': 'Marcă HDD',
                          'modelHDD': 'Model HDD',
                          'capacitateHDD': 'Capacitate',
                          'tipHDD': 'Tip HDD',
                          'rpm': 'RPM',
                          'cache': 'Cache',
                          // PSU
                          'marcaPSU': 'Marcă sursa',
                          'modelPSU': 'Model sursa',
                          'puterePSU': 'Putere',
                          'certificare': 'Certificare',
                          'modular': 'Tip cabluri',
                          'conectorGPU': 'Conector GPU',
                          // Case
                          'marcaCarcasa': 'Marcă carcasă',
                          'modelCarcasa': 'Model carcasă',
                          'formatCarcasa': 'Format',
                          'culoareCarcasa': 'Culoare',
                          'panou': 'Panou lateral',
                          'ventilatoareIncluse': 'Ventilatoare',
                          // Cooler
                          'marcaCooler': 'Marcă cooler',
                          'modelCooler': 'Model cooler',
                          'tipCooler': 'Tip cooler',
                          'socketCooler': 'Socket compatibil',
                          'tdp': 'TDP suportat',
                          // Monitor
                          'marcaMonitor': 'Marcă monitor',
                          'modelMonitor': 'Model monitor',
                          'diagonalaMonitor': 'Diagonală',
                          'rezolutieMonitor': 'Rezoluție',
                          'panouMonitor': 'Tip panou',
                          'rataRefresh': 'Rată refresh',
                          'timpRaspuns': 'Timp răspuns',
                          'adaptive': 'Adaptive Sync',
                          // Keyboard
                          'marcaTastatura': 'Marcă tastatură',
                          'modelTastatura': 'Model tastatură',
                          'tipSwitch': 'Tip switch',
                          'layout': 'Layout',
                          'conectare': 'Conectare',
                          // Mouse
                          'marcaMouse': 'Marcă mouse',
                          'modelMouse': 'Model mouse',
                          'senzor': 'Senzor',
                          'dpiMax': 'DPI max',
                          'greutateMouse': 'Greutate',
                          'conectareMouse': 'Conectare',
                          // Headset
                          'marcaCasti': 'Marcă căști',
                          'modelCasti': 'Model căști',
                          'tipCasti': 'Tip căști',
                          'conectareCasti': 'Conectare',
                          'sunetSurround': 'Sunet surround',
                          'microfon': 'Microfon',
                          // Chair
                          'marcaScaun': 'Marcă scaun',
                          'modelScaun': 'Model scaun',
                          'materialScaun': 'Material',
                          'greutateMax': 'Greutate max',
                          // Gaming
                          'platforma': 'Platformă',
                          'format': 'Format',
                          'titlu': 'Titlu',
                          'tipAccesoriu': 'Tip accesoriu',
                          'versiune': 'Versiune',
                          'titluJoc': 'Titlu joc',
                          'completitudine': 'Completitudine',
                          // Job
                          'tipOferta': 'Tip ofertă',
                          'pozitie': 'Poziție',
                          'tipContract': 'Tip contract',
                          'nivelExperienta': 'Experiență',
                          'salariu': 'Salariu',
                          // Generic
                          'stare': 'Stare',
                          'marime': 'Mărime',
                          'material': 'Material',
                          'dimensiune': 'Dimensiune',
                          'greutate': 'Greutate',
                          'varsta': 'Vârstă',
                          'sex': 'Sex',
                          'rasa': 'Rasă',
                          'vaccin': 'Vaccinat',
                        };
                        
                        const getLabel = (fieldKey: string): string => {
                          return fieldLabels[fieldKey] || fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        };
                        
                        const getIcon = (fieldKey: string) => {
                          const k = fieldKey.toLowerCase();
                          // Auto - específicos primero
                          if (k === 'km') return <Gauge className="w-4 h-4" />;
                          if (k === 'combustibil') return <Zap className="w-4 h-4" />;
                          if (k === 'putere') return <Gauge className="w-4 h-4" />;
                          if (k === 'cutie') return <Settings className="w-4 h-4" />;
                          if (k === 'tractiune') return <Car className="w-4 h-4" />;
                          if (k === 'caroserie') return <Car className="w-4 h-4" />;
                          if (k === 'capacitate') return <Gauge className="w-4 h-4" />;
                          if (k === 'model') return <Tag className="w-4 h-4" />;
                          // Inmobiliaria
                          if (k.includes('camere') || k.includes('dormitor') || k.includes('habitacion')) return <Bed className="w-4 h-4" />;
                          if (k.includes('suprafata') || k.includes('superficie') || k.includes('mp') || k.includes('metri')) return <Ruler className="w-4 h-4" />;
                          if (k.includes('etaj') || k.includes('piso') || k.includes('floor')) return <Building className="w-4 h-4" />;
                          if (k.includes('an') || k.includes('constructie') || k.includes('year') || k.includes('data')) return <Calendar className="w-4 h-4" />;
                          if (k.includes('mobilat') || k.includes('mobilier') || k.includes('amueblado')) return <Sofa className="w-4 h-4" />;
                          if (k.includes('bai') || k.includes('baie') || k.includes('baño')) return <Bath className="w-4 h-4" />;
                          if (k.includes('parcare') || k.includes('parking') || k.includes('garaj')) return <ParkingCircle className="w-4 h-4" />;
                          if (k.includes('piscina') || k.includes('pool')) return <Waves className="w-4 h-4" />;
                          if (k.includes('gradina') || k.includes('jardin') || k.includes('teren')) return <Trees className="w-4 h-4" />;
                          // Auto
                          if (k.includes('marca') || k.includes('brand')) return <Tag className="w-4 h-4" />;
                          if (k.includes('tip') || k.includes('type')) return <Settings className="w-4 h-4" />;
                          if (k.includes('latime') || k.includes('inaltime') || k.includes('dimensiune') || k.includes('marime')) return <Ruler className="w-4 h-4" />;
                          if (k.includes('diametru') || k.includes('inch')) return <CircleDot className="w-4 h-4" />;
                          if (k.includes('viteza') || k.includes('speed')) return <Gauge className="w-4 h-4" />;
                          if (k.includes('dot')) return <Calendar className="w-4 h-4" />;
                          if (k.includes('uzura') || k.includes('stare')) return <Thermometer className="w-4 h-4" />;
                          if (k.includes('bucati') || k.includes('cantitate')) return <Package className="w-4 h-4" />;
                          if (k.includes('vehicul') || k.includes('auto')) return <Car className="w-4 h-4" />;
                          if (k.includes('runflat') || k.includes('ranforsat')) return <CheckCircle className="w-4 h-4" />;
                          if (k.includes('indice')) return <Hash className="w-4 h-4" />;
                          if (k.includes('culoare')) return <CircleDot className="w-4 h-4" />;
                          return <Info className="w-4 h-4" />;
                        };
                        return (
                          <div 
                            key={key} 
                            className={`px-6 py-4 flex justify-between items-center hover:bg-[#13C1AC]/5 transition-colors
                              ${idx % 2 === 0 ? 'md:border-r border-gray-100' : ''}
                              ${idx < arr.length - 2 ? 'border-b border-gray-100' : ''}
                              ${idx === arr.length - 2 ? 'border-b md:border-b-0 border-gray-100' : ''}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-[#13C1AC]">
                                {getIcon(key)}
                              </div>
                              <span className="text-gray-500">
                                {getLabel(key)}
                              </span>
                            </div>
                            <span className="text-gray-900 font-medium border border-[#13C1AC]/30 bg-[#13C1AC]/5 px-2.5 py-0.5 rounded-full text-xs">
                              {value as string}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Información básica cuando no hay customFields */}
                {(!product.customFields || Object.keys(product.customFields).length === 0) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden description-text text-[0.9rem]">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#13C1AC] to-emerald-500 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-[0.95rem] font-semibold text-gray-900">
                        Detalii produs
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="px-6 py-4 flex justify-between items-center hover:bg-[#13C1AC]/5 transition-colors md:border-r border-gray-100 border-b">
                        <div className="flex items-center gap-3">
                          <div className="text-[#13C1AC]"><Tag className="w-4 h-4" /></div>
                          <span className="text-gray-500">Categorie</span>
                        </div>
                        <span className="text-gray-900 font-medium border border-[#13C1AC]/30 bg-[#13C1AC]/5 px-2.5 py-0.5 rounded-full text-xs">
                          {product.category}
                        </span>
                      </div>
                      {product.subcategory && (
                        <div className="px-6 py-4 flex justify-between items-center hover:bg-[#13C1AC]/5 transition-colors border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="text-[#13C1AC]"><Settings className="w-4 h-4" /></div>
                            <span className="text-gray-500">Subcategorie</span>
                          </div>
                          <span className="text-gray-900 font-medium border border-[#13C1AC]/30 bg-[#13C1AC]/5 px-2.5 py-0.5 rounded-full text-xs">
                            {product.subcategory}
                          </span>
                        </div>
                      )}
                      <div className="px-6 py-4 flex justify-between items-center hover:bg-[#13C1AC]/5 transition-colors md:border-r border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="text-[#13C1AC]"><MapPin className="w-4 h-4" /></div>
                          <span className="text-gray-500">Locație</span>
                        </div>
                        <span className="text-gray-900 font-medium border border-[#13C1AC]/30 bg-[#13C1AC]/5 px-2.5 py-0.5 rounded-full text-xs">
                          {product.location}
                        </span>
                      </div>
                      {/* Metoda de predare */}
                      <div className="px-6 py-4 flex justify-between items-center hover:bg-[#13C1AC]/5 transition-colors border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={product.deliveryType === 'shipping' || product.deliveryType === 'both' ? 'text-purple-500' : 'text-[#13C1AC]'}>
                            {product.deliveryType === 'shipping' || product.deliveryType === 'both' ? <Truck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                          </div>
                          <span className="text-gray-500">Predare</span>
                        </div>
                        <span className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${
                          product.deliveryType === 'shipping' || product.deliveryType === 'both' 
                            ? 'text-purple-600 border border-purple-300 bg-purple-50' 
                            : 'text-gray-900 border border-[#13C1AC]/30 bg-[#13C1AC]/5'
                        }`}>
                          {product.deliveryType === 'shipping' ? 'Livrare disponibilă' : 
                           product.deliveryType === 'both' ? 'Personal + Livrare' : 
                           'Predare personală'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Right Column: Price & Seller Info */}
            <div className="space-y-6">
                
                {/* Price Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                    <div className="flex justify-between items-start mb-4">
                        <h1 className="description-text text-xl md:text-2xl font-bold text-gray-900 flex-1 mr-4">
                            {product.title.length > 45 ? product.title.substring(0, 45) + '...' : product.title}
                        </h1>
                    </div>
                    <div className="text-4xl font-extrabold text-gray-900 mb-3">{product.price} €</div>
                    
                    {/* Condition & Negotiable Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        {/* Condition badge */}
                        {getConditionInfo(product.condition) ? (() => {
                          const conditionInfo = getConditionInfo(product.condition);
                          const Icon = conditionInfo?.icon;
                          return (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 ${conditionInfo?.color}`}>
                              {Icon && <Icon className="w-3 h-3" />}
                              {conditionInfo?.label}
                            </span>
                          );
                        })() : product.condition && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 bg-gray-500 text-white">
                            <CheckCircle className="w-3 h-3" />
                            {product.condition}
                          </span>
                        )}
                        
                        {/* Category badge if no condition */}
                        {!product.condition && product.category && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 bg-[#13C1AC] text-white">
                            <Tag className="w-3 h-3" />
                            {product.subcategory || product.category}
                          </span>
                        )}
                        
                        {/* Negotiable badge */}
                        {product.negotiable && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 bg-violet-500 text-white">
                            <MessageCircle className="w-3 h-3" />
                            Negociabil
                          </span>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => {
                            if (product) {
                                createOrGetConversation(
                                    product.id,
                                    product.title,
                                    product.images?.[0] || product.image,
                                    product.price,
                                    product.seller.id,
                                    product.seller.name
                                );
                                router.push('/messages');
                            }
                        }}
                        className="w-full bg-[#13C1AC] text-white font-bold py-3 px-4 rounded-full hover:bg-[#10a593] transition-colors mb-3 flex items-center justify-center shadow-lg shadow-teal-500/30"
                    >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Chat
                    </button>
                    <button className="w-full bg-[#E5F9F6] text-[#13C1AC] font-bold py-3 px-4 rounded-full hover:bg-[#d0f5f0] transition-colors">
                        Cumpără acum
                    </button>
                </div>

                {/* Seller Card */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <Link href={`/user/${product.seller.id}`} className="flex items-center mb-4 group cursor-pointer">
                        <div className="mr-4 group-hover:opacity-80 transition-opacity">
                            <Avatar src={product.seller.avatar} name={product.seller.name} size="lg" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#13C1AC] transition-colors">{product.seller.name}</h3>
                            <div className="flex items-center text-sm">
                                <div className="flex text-yellow-400 mr-1">
                                    {[...Array(5)].map((_, i) => (
                                         <svg key={i} className={`h-4 w-4 ${i < Math.floor(product.seller.rating || 5) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                         </svg>
                                    ))}
                                </div>
                                <span className="text-gray-500">({product.seller.reviews || 0} recenzii)</span>
                            </div>
                        </div>
                    </Link>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4 mt-4">
                        <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {product.location}
                        </div>
                        <div>
                           Membru din {product.seller.joined || '2024'}
                        </div>
                    </div>
                </div>

                {/* Safety Tips */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-3">Sfaturi de siguranță</h3>
                    <ul className="space-y-3 text-sm text-gray-600">
                        <li className="flex items-start">
                            <div className="bg-blue-50 p-1 rounded-full text-blue-500 mr-3 mt-0.5">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            <span>Nu trimite bani înainte de a vedea produsul.</span>
                        </li>
                        <li className="flex items-start">
                             <div className="bg-blue-50 p-1 rounded-full text-blue-500 mr-3 mt-0.5">
                                <MessageCircle className="h-4 w-4" />
                             </div>
                            <span>Folosește chat-ul pentru a comunica.</span>
                        </li>
                    </ul>
                </div>

            </div>
        </div>

        {/* More from seller section */}
        {sellerProducts.length > 0 && (
          <div className="mt-10 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Mai multe de la vânzător</h2>
              <span className="text-sm text-gray-500 border border-gray-200 px-3 py-1 rounded-full">
                {sellerProducts.length} anunțuri
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sellerProducts.map((item, index) => (
                 <div 
                   key={item.id} 
                   className="h-full"
                  
                 >
                    <ProductCard product={item} />
                 </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Botón cerrar */}
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Contador de imágenes */}
          <div className="absolute top-6 left-6 text-white/80 text-sm font-medium">
            {currentImageIndex + 1}/{images.length}
          </div>

          {/* Imagen principal */}
          <div 
            className="flex-1 flex items-center justify-center p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Flecha izquierda */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1);
                }}
                className="absolute left-4 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
            )}

            {/* All images with display toggle for instant switching */}
            <div className="relative max-w-5xl w-full h-full max-h-[75vh] flex items-center justify-center">
              {images.map((img, idx) => (
                <Image
                  key={idx}
                  src={img}
                  alt={product.title}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  style={{ display: idx === currentImageIndex ? 'block' : 'none' }}
                  quality={85}
                />
              ))}
            </div>

            {/* Flecha derecha */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1);
                }}
                className="absolute right-4 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>
            )}
          </div>

          {/* Barra inferior con thumbnails, info y chat */}
          <div 
            className="bg-zinc-900 border-t border-white/10 px-4 py-4 md:py-6 pb-8 md:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Thumbnails row */}
            {images.length > 1 && (
              <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                      currentImageIndex === idx 
                        ? 'border-[#13C1AC] ring-2 ring-[#13C1AC]/30' 
                        : 'border-white/20 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`Miniatura ${idx + 1}`} fill sizes="56px" className="object-cover" quality={50} />
                  </button>
                ))}
              </div>
            )}
            
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              {/* Info del vendedor y anuncio */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  <Avatar src={product.seller.avatar} name={product.seller.name} size="md" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-white font-medium truncate text-lg">{product.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                     <span>{product.seller.name}</span>
                     <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                     <span className="text-emerald-400 font-bold text-base">{product.price} €</span>
                  </div>
                </div>
              </div>

              {/* Botón Chat */}
              <button
                onClick={() => {
                   setLightboxOpen(false);
                   // Aquí iría la lógica para escrolear al chat o abrirlo
                }}
                className="px-6 py-2.5 bg-[#13C1AC] hover:bg-[#0fa895] text-white font-semibold rounded-full transition-colors flex-shrink-0 shadow-lg shadow-teal-900/20"
              >
                Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
