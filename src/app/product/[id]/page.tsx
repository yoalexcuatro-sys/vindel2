'use client';

import { Heart, Share2, Eye, Flag, MessageCircle, MapPin, ShieldCheck, ChevronLeft, ChevronRight, Tag, Gauge, Ruler, Calendar, Hash, Car, CircleDot, Package, Settings, Zap, Thermometer, Clock, CheckCircle, Info, X, Home, Bed, Bath, Building, Sofa, Waves, ParkingCircle, Trees } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getProduct, getProducts, Product } from '@/lib/products-service';
import { createOrGetConversation } from '@/lib/messages';
import ProductCard from '@/components/ProductCard';
import { extractIdFromSlug } from '@/lib/slugs';
import Avatar from '@/components/Avatar';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

            // Obtener otros productos del mismo vendedor
            const sellerResult = await getProducts({ sellerId: foundProduct.sellerId }, 6);
            const otherProducts = sellerResult.products.filter(p => p.id !== foundProduct.id).slice(0, 5);
            setSellerProducts(otherProducts);
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
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

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
                
                {/* Image Gallery */}
                <div 
                    className="bg-gray-100 rounded-xl overflow-hidden shadow-sm relative h-[400px] md:h-[500px] flex items-center justify-center group cursor-pointer"
                    onClick={() => setLightboxOpen(true)}
                >
                    {/* Main Image Layer - Optimized for performance */}
                    <Image 
                        src={images[currentImageIndex]} 
                        alt={product.title} 
                        fill
                        className="object-contain"
                        priority
                        sizes="(max-width: 768px) 100vw, 800px"
                    />
                    
                    {/* Image counter */}
                    <div className="absolute top-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-lg backdrop-blur-md font-medium z-10">
                        {currentImageIndex + 1}/{images.length}
                    </div>
                    
                    {images.length > 1 && (
                      <>
                        <button 
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white hover:bg-gray-100 rounded-full text-gray-800 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white hover:bg-gray-100 rounded-full text-gray-800 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                      </>
                    )}

                    <button 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
                    >
                        <Share2 className="h-6 w-6" />
                    </button>
                    <button 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-4 right-16 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
                    >
                        <Heart className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {product.views || 0} vizualizări
                    </div>
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
                {(product as any).detallesExtra && Object.keys((product as any).detallesExtra).length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden description-text text-[0.9rem]">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#13C1AC] to-emerald-500 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-[0.95rem] font-semibold text-gray-900">
                        {(product as any).subcategory || 'Detalii produs'}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {Object.entries((product as any).detallesExtra).map(([key, value], idx, arr) => {
                        const getIcon = (fieldKey: string) => {
                          const k = fieldKey.toLowerCase();
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
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
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
                    <div className="text-4xl font-extrabold text-gray-900 mb-2">{product.price} €</div>
                    <div className="flex items-center text-gray-500 text-sm mb-6">
                        <span className="bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full text-blue-500 font-medium">
                            {product.condition === 'new' ? 'Nou' : 
                             product.condition === 'like-new' ? 'Ca nou' :
                             product.condition === 'good' ? 'Bună' : 
                             product.condition === 'fair' ? 'Folosit' : product.condition}
                        </span>
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
              {sellerProducts.map((item) => (
                 <div key={item.id} className="h-full">
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

            {/* Imagen */}
            <div className="relative max-w-5xl w-full h-full max-h-[75vh] flex items-center justify-center">
              <Image
                src={images[currentImageIndex]}
                alt={product.title}
                fill
                className="object-contain"
                sizes="100vw"
                priority
                quality={90}
              />
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

          {/* Barra inferior con info y chat */}
          <div 
            className="bg-zinc-900 border-t border-white/10 px-4 py-4 md:py-6 pb-8 md:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
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
