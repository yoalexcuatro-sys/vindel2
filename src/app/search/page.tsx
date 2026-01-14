
'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getProducts, Product } from '@/lib/products-service';
import ProductCard from '@/components/ProductCard';
import { Filter, SlidersHorizontal, MapPin, Tag, ChevronDown, X, ChevronUp, Grid3X3, LayoutList, ArrowUpDown, Sparkles, Star, ThumbsUp, Package, Heart, Clock, CheckCircle, Home, Car, Briefcase, Wrench, Smartphone, Shirt, PawPrint, Armchair, Dumbbell, Baby, Plane, Gamepad2, Layers } from 'lucide-react';
import { localidades, Localidad } from '@/data/localidades';
import Link from 'next/link';
import Image from 'next/image';
import { createProductLink } from '@/lib/slugs';

import { Timestamp } from 'firebase/firestore';

// Helper to convert publishedAt to Date
const getPublishedDate = (publishedAt: any): Date => {
  if (!publishedAt) return new Date(0);
  if (publishedAt instanceof Timestamp) return publishedAt.toDate();
  if (publishedAt.toDate && typeof publishedAt.toDate === 'function') return publishedAt.toDate();
  return new Date(publishedAt);
};

// Helper to format time ago
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Acum';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours} ore`;
  if (diffDays < 7) return `${diffDays} zile`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} săpt`;
  return `${Math.floor(diffDays / 30)} luni`;
};

// Helper to get condition label and color
const getConditionLabel = (condition?: string): { label: string; color: string } | null => {
  if (!condition) return null;
  const conditions: Record<string, { label: string; color: string }> = {
    'new': { label: 'Nou', color: 'bg-emerald-500 text-white' },
    'like-new': { label: 'Ca nou', color: 'bg-cyan-500 text-white' },
    'good': { label: 'Bună', color: 'bg-blue-500 text-white' },
    'fair': { label: 'Folosit', color: 'bg-gray-500 text-white' },
    'nou-sigilat': { label: 'Sigilat', color: 'bg-emerald-500 text-white' },
    'nou-desigilat': { label: 'Nou', color: 'bg-blue-500 text-white' },
    'ca-nou': { label: 'Ca nou', color: 'bg-cyan-500 text-white' },
    'folosit-functional': { label: 'Folosit', color: 'bg-gray-500 text-white' },
    'nou': { label: 'Nou', color: 'bg-emerald-500 text-white' },
    'folosit': { label: 'Folosit', color: 'bg-gray-500 text-white' },
  };
  return conditions[condition] || null;
};

// Separate component to wrap in Suspense because of useSearchParams
function SearchResults() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevant');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const result = await getProducts({}, 100);
        setProducts(result.products);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const currencyParam = searchParams.get('currency') || ''; // EUR or RON - empty means no currency filter
  const locationParam = searchParams.get('location');
  const conditionParam = searchParams.get('condition'); // "new", "used", etc.
  const negotiableParam = searchParams.get('negotiable') === 'true';

  // Filtering Logic
  const filteredProducts = products.filter((product) => {
    // Text Search - buscar en título, descripción Y ubicación
    const searchQuery = query.toLowerCase();
    const matchesText = 
        product.title.toLowerCase().includes(searchQuery) || 
        product.description.toLowerCase().includes(searchQuery) ||
        product.location.toLowerCase().includes(searchQuery);
    
    // Currency filter - if filtering by price, only show products in that currency
    const productCurrency = product.currency || 'RON';
    const matchesCurrency = currencyParam 
      ? productCurrency === currencyParam 
      : true;
    
    // Price - only compare if currencies match
    const matchesMinPrice = minPriceParam && matchesCurrency ? product.price >= Number(minPriceParam) : true;
    const matchesMaxPrice = maxPriceParam && matchesCurrency ? product.price <= Number(maxPriceParam) : true;

    // Location
    const matchesLocation = locationParam 
      ? product.location.toLowerCase().includes(locationParam.toLowerCase()) 
      : true;

    // Condition - support multiple conditions separated by comma
    const matchesCondition = conditionParam 
        ? conditionParam.split(',').some(cond => product.condition?.toLowerCase() === cond.toLowerCase())
        : true;
    
    // Category - support multiple categories separated by comma
    const matchesCategory = categoryParam
        ? categoryParam.split(',').some(cat => product.category === cat)
        : true;

    // Negotiable
    const matchesNegotiable = negotiableParam ? product.negotiable === true : true;

    return matchesText && matchesCurrency && matchesMinPrice && matchesMaxPrice && matchesLocation && matchesCondition && matchesCategory && matchesNegotiable;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch(sortBy) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'newest': return getPublishedDate(b.publishedAt).getTime() - getPublishedDate(a.publishedAt).getTime();
      default: return 0;
    }
  });

  const sortOptions = [
    { value: 'relevant', label: 'Relevanță' },
    { value: 'newest', label: 'Cele mai recente' },
    { value: 'price-asc', label: 'Preț crescător' },
    { value: 'price-desc', label: 'Preț descrescător' },
  ];

  if (loading) return (
    <div className="flex flex-col space-y-4 sm:space-y-6">
      {/* Skeleton Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-4 border-b border-gray-200">
        <div className="h-6 sm:h-7 w-40 sm:w-48 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-9 w-20 bg-gray-100 rounded-lg animate-pulse hidden sm:block"></div>
        </div>
      </div>
      {/* Skeleton Grid - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-gray-100 shadow-sm">
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-lg sm:rounded-xl mb-2 sm:mb-3 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-1.5 sm:mb-2 animate-pulse"></div>
            <div className="h-2.5 sm:h-3 bg-gray-100 rounded w-1/2 mb-2 sm:mb-3 animate-pulse"></div>
            <div className="flex justify-between items-center pt-1 sm:pt-2">
              <div className="h-4 sm:h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-6 sm:h-8 bg-gray-100 rounded w-12 sm:w-16 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-4 sm:space-y-6">
        <style jsx>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes listFadeIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-fadeInUp { animation: fadeInUp 0.4s ease-out forwards; }
          .animate-fadeInScale { animation: fadeInScale 0.35s ease-out forwards; }
          .animate-listFadeIn { animation: listFadeIn 0.4s ease-out forwards; }
          /* Hide number input spinners */
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}</style>
        
        {/* Header - Mobile optimized */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-4 border-b border-gray-200 animate-fadeInUp relative z-20">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
                  <span className="text-[#13C1AC]">{sortedProducts.length}</span> {sortedProducts.length === 1 ? 'rezultat' : 'rezultate'} 
                  {query && <span className="text-gray-500 text-sm sm:text-base font-normal"> pentru "{query}"</span>}
              </h1>
              {categoryParam && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">Categorie:</span>
                  <span className="text-xs font-medium text-[#13C1AC] bg-[#13C1AC]/10 px-2 py-0.5 rounded-full">{categoryParam}</span>
                </div>
              )}
            </div>
            
            {/* Controls Row */}
            <div className="flex items-center justify-between sm:justify-end gap-2 relative z-30 w-full sm:w-auto">
              {/* Sort Dropdown - Improved design */}
              <div className="relative z-[100]">
                <button 
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-[#13C1AC] hover:shadow-sm active:scale-[0.98] transition-all shadow-sm"
                >
                  <ArrowUpDown className="w-4 h-4 text-[#13C1AC]" />
                  <span>{sortOptions.find(o => o.value === sortBy)?.label || 'Sortare'}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showSortMenu && (
                  <>
                    {/* Backdrop to close menu */}
                    <div 
                      className="fixed inset-0 z-[90]" 
                      onClick={() => setShowSortMenu(false)}
                    />
                    <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] overflow-hidden">
                      <div className="py-1">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => { setSortBy(option.value); setShowSortMenu(false); }}
                            className={`w-full px-4 py-3 text-left text-sm transition-all flex items-center justify-between ${
                              sortBy === option.value 
                                ? 'bg-gradient-to-r from-[#13C1AC]/10 to-transparent text-[#13C1AC] font-semibold' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <span>{option.label}</span>
                            {sortBy === option.value && (
                              <span className="w-2 h-2 bg-[#13C1AC] rounded-full"></span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* View Toggle - Now visible on mobile too */}
              <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 sm:p-2.5 transition-all ${viewMode === 'grid' ? 'bg-[#13C1AC] text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <div className="w-px h-4 sm:h-5 bg-gray-200"></div>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 sm:p-2.5 transition-all ${viewMode === 'list' ? 'bg-[#13C1AC] text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
        </div>

        {sortedProducts.length > 0 ? (
            viewMode === 'list' ? (
              // Elegant List View
              <div className="space-y-3">
                {sortedProducts.map((product, index) => {
                  const publishDate = getPublishedDate(product.publishedAt);
                  const timeAgo = getTimeAgo(publishDate);
                  const conditionInfo = getConditionLabel(product.condition);
                  
                  return (
                    <Link
                      key={product.id}
                      href={createProductLink(product)}
                      className="group flex bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#13C1AC]/30 animate-listFadeIn"
                      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
                    >
                      {/* Image - Clean, no overlays */}
                      <div className="relative w-32 sm:w-44 md:w-52 flex-shrink-0 aspect-square sm:aspect-[4/3]">
                        <Image
                          src={product.image || '/placeholder.jpg'}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 128px, (max-width: 768px) 176px, 208px"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                        <div>
                          {/* Title */}
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 group-hover:text-[#13C1AC] transition-colors">
                            {product.title}
                          </h3>
                          
                          {/* Location & Time */}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {product.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo}
                            </span>
                          </div>
                          
                          {/* Description preview - only on larger screens */}
                          {product.description && (
                            <p className="hidden sm:block mt-2 text-xs text-gray-500 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Bottom: Price, Condition & Favorite */}
                        <div className="flex items-center justify-between mt-2 sm:mt-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-baseline">
                              <span className="text-lg sm:text-xl font-bold text-[#13C1AC]">
                                {product.price?.toLocaleString('ro-RO')}
                              </span>
                              <span className="text-sm sm:text-base font-semibold text-[#13C1AC] ml-1">
                                {product.currency === 'EUR' ? '€' : 'lei'}
                              </span>
                            </div>
                            {product.negotiable && (
                              <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                Negociabil
                              </span>
                            )}
                            {/* Condition Badge */}
                            {conditionInfo && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${conditionInfo.color}`}>
                                {conditionInfo.label}
                              </span>
                            )}
                          </div>
                          
                          {/* Right side: Favorite & View */}
                          <div className="flex items-center gap-2">
                            <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-[#13C1AC] opacity-0 group-hover:opacity-100 transition-opacity">
                              Vezi detalii
                              <ChevronDown className="w-3 h-3 -rotate-90" />
                            </span>
                            {/* Favorite Button */}
                            <button 
                              onClick={(e) => { e.preventDefault(); }}
                              className="p-1.5 bg-gray-100 hover:bg-red-50 rounded-full hover:scale-110 transition-all"
                            >
                              <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              // Grid View
              <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {sortedProducts.map((product, index) => (
                    <div 
                      key={product.id} 
                      className="animate-fadeInScale"
                      style={{ animationDelay: `${Math.min(index * 40, 320)}ms`, opacity: 0 }}
                    >
                      <ProductCard product={product} />
                    </div>
                ))}
              </div>
            )
        ) : (
            <div className="text-center py-12 sm:py-20 bg-gray-50 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-200 animate-fadeInUp">
                <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Filter className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Nu am găsit rezultate</h3>
                <p className="text-sm text-gray-500 px-4">Încearcă alți termeni de căutare sau filtre mai puțin specifice.</p>
            </div>
        )}
    </div>
  );
}

// Sidebar Filters Component - Mobile optimized
function SearchFiltersSidebar({ onClose }: { onClose?: () => void }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const ubicacionRef = useRef<HTMLDivElement>(null);
    
    // Local state for filters to avoid URL thrashing on every keystroke
    const [priceMin, setPriceMin] = useState(searchParams.get('minPrice') || '');
    const [priceMax, setPriceMax] = useState(searchParams.get('maxPrice') || '');
    const [currency, setCurrency] = useState<'EUR' | 'RON' | ''>((searchParams.get('currency') as 'EUR' | 'RON' | '') || '');
    const [location, setLocation] = useState(searchParams.get('location') || '');
    const [showUbicacionSugerencias, setShowUbicacionSugerencias] = useState(false);
    const [selectedConditions, setSelectedConditions] = useState<string[]>(
      searchParams.get('condition')?.split(',').filter(Boolean) || []
    );
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
      searchParams.get('category')?.split(',').filter(Boolean) || []
    );
    const [negotiableOnly, setNegotiableOnly] = useState(
      searchParams.get('negotiable') === 'true'
    );

    // Categories list
    const FILTER_CATEGORIES = [
      { id: 'imobiliare', name: 'Imobiliare', icon: Home },
      { id: 'auto-moto', name: 'Auto & Moto', icon: Car },
      { id: 'locuri-de-munca', name: 'Locuri de muncă', icon: Briefcase },
      { id: 'matrimoniale', name: 'Matrimoniale', icon: Heart },
      { id: 'servicii', name: 'Servicii', icon: Wrench },
      { id: 'electronice', name: 'Electronice', icon: Smartphone },
      { id: 'moda', name: 'Modă', icon: Shirt },
      { id: 'animale', name: 'Animale', icon: PawPrint },
      { id: 'casa-gradina', name: 'Casă & Grădină', icon: Armchair },
      { id: 'sport', name: 'Sport', icon: Dumbbell },
      { id: 'copii', name: 'Copii', icon: Baby },
      { id: 'turism', name: 'Turism', icon: Plane },
      { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
    ];

    const toggleCategory = (catId: string) => {
      setSelectedCategories(prev => 
        prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
      );
    };

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const categoryRef = useRef<HTMLDivElement>(null);

    // Click outside to close suggestions
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ubicacionRef.current && !ubicacionRef.current.contains(event.target as Node)) {
                setShowUbicacionSugerencias(false);
            }
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setShowCategoryDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter localidades based on input
    const localidadesFiltradas = location.length >= 2 && !location.includes(',')
        ? localidades
            .filter(loc => 
                loc.ciudad.toLowerCase().includes(location.toLowerCase()) ||
                loc.judet.toLowerCase().includes(location.toLowerCase())
            )
            .sort((a, b) => {
                const aStarts = a.ciudad.toLowerCase().startsWith(location.toLowerCase());
                const bStarts = b.ciudad.toLowerCase().startsWith(location.toLowerCase());
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return a.ciudad.localeCompare(b.ciudad);
            })
            .slice(0, 15)
        : [];

    const handleSeleccionarUbicacion = (loc: Localidad) => {
        setLocation(`${loc.ciudad}, ${loc.judet}`);
        setShowUbicacionSugerencias(false);
    };

    const toggleCondition = (cond: string) => {
      setSelectedConditions(prev => 
        prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
      );
    };

    // Function to apply filters
    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (priceMin) params.set('minPrice', priceMin); else params.delete('minPrice');
        if (priceMax) params.set('maxPrice', priceMax); else params.delete('maxPrice');
        if (currency) params.set('currency', currency); else params.delete('currency');
        if (location) params.set('location', location); else params.delete('location');
        if (selectedConditions.length > 0) params.set('condition', selectedConditions.join(',')); else params.delete('condition');
        if (selectedCategories.length > 0) params.set('category', selectedCategories.join(',')); else params.delete('category');
        if (negotiableOnly) params.set('negotiable', 'true'); else params.delete('negotiable');
        
        router.push(`/search?${params.toString()}`);
        if (onClose) onClose();
    };

    const clearFilters = () => {
      setPriceMin('');
      setPriceMax('');
      setCurrency('');
      setLocation('');
      setSelectedConditions([]);
      setSelectedCategories([]);
      setNegotiableOnly(false);
      router.push('/search');
      if (onClose) onClose();
    };

    const hasActiveFilters = priceMin || priceMax || location || selectedConditions.length > 0 || selectedCategories.length > 0 || currency || negotiableOnly;

    // Filter content JSX (not a component to avoid re-mounting)
    const filterContent = (
      <div className="space-y-2">
        {/* Mobile Header */}
        {onClose && (
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 lg:hidden">
            <h2 className="text-lg font-bold text-gray-900">Filtre</h2>
            <button 
              onClick={onClose}
              className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Category Filter */}
        <div className="p-2.5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#13C1AC] rounded-full"></span>
                  Categorie
                </h3>
                <div ref={categoryRef} className="relative">
                  {/* Selected Display */}
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-white ring-1 ring-inset transition-all text-left ${
                      showCategoryDropdown 
                        ? 'ring-[#13C1AC] ring-2' 
                        : selectedCategories.length > 0 
                          ? 'ring-[#13C1AC]' 
                          : 'ring-gray-200 hover:ring-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {selectedCategories.length > 0 ? (
                        <>
                          {(() => {
                            const cat = FILTER_CATEGORIES.find(c => c.id === selectedCategories[0]);
                            const Icon = cat?.icon || Layers;
                            return (
                              <>
                                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#13C1AC] to-[#0ea895] flex items-center justify-center flex-shrink-0">
                                  <Icon className="w-4 h-4 text-white" />
                                </span>
                                <span className="text-sm font-semibold text-gray-900 truncate">{cat?.name}</span>
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <>
                          <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-4 h-4 text-gray-400" />
                          </span>
                          <span className="text-sm font-medium text-gray-500">Toate categoriile</span>
                        </>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                      showCategoryDropdown ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {/* Dropdown */}
                  {showCategoryDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="max-h-64 overflow-y-auto p-1.5">
                        {/* All categories option */}
                        <button
                          onClick={() => {
                            setSelectedCategories([]);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${
                            selectedCategories.length === 0
                              ? 'bg-[#13C1AC]/10 text-[#13C1AC]'
                              : 'hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            selectedCategories.length === 0
                              ? 'bg-[#13C1AC] text-white'
                              : 'bg-gray-100'
                          }`}>
                            <Layers className="w-4 h-4" />
                          </span>
                          <span className="text-sm font-medium">Toate categoriile</span>
                          {selectedCategories.length === 0 && (
                            <CheckCircle className="w-4 h-4 ml-auto" />
                          )}
                        </button>

                        {/* Divider */}
                        <div className="h-px bg-gray-100 my-1.5" />

                        {/* Category options */}
                        {FILTER_CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          const isSelected = selectedCategories.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setSelectedCategories([cat.id]);
                                setShowCategoryDropdown(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-[#13C1AC]/10 text-[#13C1AC]'
                                  : 'hover:bg-gray-50 text-gray-600'
                              }`}
                            >
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-br from-[#13C1AC] to-[#0ea895] text-white'
                                  : 'bg-gray-100 group-hover:bg-gray-200'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </span>
                              <span className="text-sm font-medium">{cat.name}</span>
                              {isSelected && (
                                <CheckCircle className="w-4 h-4 ml-auto" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
            </div>
            

            {/* Price Filter */}
            <div className="p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#13C1AC] rounded-full"></span>
                    Preț
                  </h3>
                  {/* Currency Toggle */}
                  <div className="flex items-center bg-white rounded-lg p-0.5 ring-1 ring-inset ring-gray-200">
                    <button
                      onClick={() => setCurrency('')}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                        currency === '' 
                          ? 'bg-[#13C1AC] text-white' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Toate
                    </button>
                    <button
                      onClick={() => setCurrency('EUR')}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                        currency === 'EUR' 
                          ? 'bg-[#13C1AC] text-white' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      € EUR
                    </button>
                    <button
                      onClick={() => setCurrency('RON')}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                        currency === 'RON' 
                          ? 'bg-[#13C1AC] text-white' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      LEI
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-[#13C1AC] text-sm font-medium">{currency === 'EUR' ? '€' : currency === 'RON' ? 'lei' : ''}</span>
                        </div>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Min"
                            value={priceMin}
                            onChange={(e) => setPriceMin(e.target.value.replace(/[^0-9]/g, ''))}
                            className={`block w-full rounded-lg border-0 py-2.5 ${currency === 'EUR' ? 'pl-7' : currency === 'RON' ? 'pl-9' : 'pl-3'} text-gray-900 bg-white ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#13C1AC] text-sm font-medium`}
                        />
                    </div>
                    <span className="text-gray-300 font-medium">—</span>
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-[#13C1AC] text-sm font-medium">{currency === 'EUR' ? '€' : currency === 'RON' ? 'lei' : ''}</span>
                        </div>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Max"
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value.replace(/[^0-9]/g, ''))}
                            className={`block w-full rounded-lg border-0 py-2.5 ${currency === 'EUR' ? 'pl-7' : currency === 'RON' ? 'pl-9' : 'pl-3'} text-gray-900 bg-white ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#13C1AC] text-sm font-medium`}
                        />
                    </div>
                </div>
            </div>


            {/* Location Filter */}
            <div ref={ubicacionRef} className="p-2.5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#13C1AC] rounded-full"></span>
                  Locație
                </h3>
                <div className="relative">
                    <div className={`flex items-center rounded-lg ring-1 ring-inset transition-all bg-white ${
                        location.includes(',')
                            ? 'ring-[#13C1AC] bg-[#13C1AC]/5'
                            : 'ring-gray-200 focus-within:ring-2 focus-within:ring-[#13C1AC]'
                    }`}>
                        <div className="flex items-center pl-3">
                            <MapPin className={`h-4 w-4 ${location.includes(',') ? 'text-[#13C1AC]' : 'text-gray-400'}`} />
                        </div>
                        <input
                            type="text"
                            placeholder="Oraș sau județ"
                            value={location}
                            onChange={(e) => {
                                setLocation(e.target.value);
                                setShowUbicacionSugerencias(true);
                            }}
                            onFocus={() => setShowUbicacionSugerencias(true)}
                            className={`block w-full border-0 py-2.5 pl-2 pr-8 bg-transparent text-sm focus:ring-0 outline-none font-medium ${
                                location.includes(',') ? 'text-[#13C1AC]' : 'text-gray-900 placeholder:text-gray-400'
                            }`}
                        />
                        {location && (
                            <button
                                type="button"
                                onClick={() => setLocation('')}
                                className={`mr-2 p-1 rounded-full transition-colors active:scale-95 ${
                                    location.includes(',') ? 'hover:bg-[#13C1AC]/20' : 'hover:bg-gray-100'
                                }`}
                            >
                                <X className={`w-3.5 h-3.5 ${location.includes(',') ? 'text-[#13C1AC]' : 'text-gray-400'}`} />
                            </button>
                        )}
                    </div>
                    
                    {/* Suggestions dropdown */}
                    {showUbicacionSugerencias && localidadesFiltradas.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                            {localidadesFiltradas.map((loc, index) => (
                                <button
                                    key={`${loc.ciudad}-${loc.judet}-${index}`}
                                    type="button"
                                    onClick={() => handleSeleccionarUbicacion(loc)}
                                    className="w-full px-3 py-2 text-left hover:bg-[#13C1AC]/10 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-2 active:bg-[#13C1AC]/20"
                                >
                                    <MapPin className="w-4 h-4 text-[#13C1AC] flex-shrink-0" />
                                    <div className="text-sm">
                                        <span className="font-medium text-gray-900">{loc.ciudad}</span>
                                        <span className="text-gray-500">, {loc.judet}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {/* No results message */}
                    {showUbicacionSugerencias && location.length >= 2 && localidadesFiltradas.length === 0 && !location.includes(',') && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 text-center text-gray-500 text-sm">
                            Nu s-au găsit rezultate
                        </div>
                    )}
                </div>
            </div>

            {/* Show More Button */}
            <div className="px-2.5">
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#13C1AC] hover:text-[#0ea895] transition-colors"
              >
                <span>{showMoreFilters ? 'Ascunde filtre' : 'Arată mai multe'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Collapsible Filters */}
            {showMoreFilters && (
              <>
                {/* Condition Filter - Colored tags style */}
                <div className="p-2.5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#13C1AC] rounded-full"></span>
                    Stare
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'Nou', color: 'emerald', Icon: Sparkles },
                        { value: 'Ca nou', color: 'blue', Icon: Star },
                        { value: 'Bună', color: 'amber', Icon: ThumbsUp },
                        { value: 'Folosit', color: 'gray', Icon: Package }
                      ].map((cond) => {
                          const isSelected = selectedConditions.includes(cond.value);
                          const colorStyles = {
                            emerald: isSelected 
                              ? 'bg-emerald-500 text-white ring-emerald-500' 
                              : 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100',
                            blue: isSelected 
                              ? 'bg-blue-500 text-white ring-blue-500' 
                              : 'bg-blue-50 text-blue-700 ring-blue-200 hover:bg-blue-100',
                            amber: isSelected 
                              ? 'bg-amber-500 text-white ring-amber-500' 
                              : 'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100',
                            gray: isSelected 
                              ? 'bg-gray-500 text-white ring-gray-500' 
                              : 'bg-gray-100 text-gray-600 ring-gray-200 hover:bg-gray-200',
                          };
                          return (
                            <button
                              key={cond.value}
                              onClick={() => toggleCondition(cond.value)}
                              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 ring-1 ring-inset flex items-center justify-center gap-2 ${colorStyles[cond.color as keyof typeof colorStyles]}`}
                            >
                                <cond.Icon className="w-4 h-4" />
                                {cond.value}
                            </button>
                          );
                      })}
                  </div>
                </div>


                {/* Negotiable Filter */}
                <div className="p-2.5">
                    <button
                      onClick={() => setNegotiableOnly(!negotiableOnly)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg ring-1 ring-inset transition-all ${
                        negotiableOnly 
                          ? 'bg-purple-500 text-white ring-purple-500' 
                          : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Tag className="w-4 h-4" />
                        <span className="text-sm font-semibold">Negociabil</span>
                      </div>
                      <div className={`w-10 h-6 rounded-full p-0.5 transition-all ${
                        negotiableOnly ? 'bg-purple-300' : 'bg-gray-200'
                      }`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          negotiableOnly ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </div>
                    </button>
                </div>
              </>
            )}


            {/* Action Buttons */}
            <div className="space-y-2 pt-1 px-2.5">
              <button 
                  onClick={applyFilters}
                  className="w-full bg-gradient-to-r from-[#13C1AC] to-[#0ea895] text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-[#13C1AC]/30 transition-all active:scale-[0.98] shadow-md text-sm"
              >
                  Aplică filtre
              </button>
              {hasActiveFilters && (
                <button 
                    onClick={clearFilters}
                    className="w-full bg-white text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98] ring-1 ring-inset ring-gray-200 text-sm"
                >
                    Șterge filtrele
                </button>
              )}
            </div>
        </div>
    );

    // If called from mobile (has onClose), render just the content
    if (onClose) {
      return filterContent;
    }

    // Desktop: render with waves container
    return (
        <div className="w-full lg:w-64 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden relative bg-white border border-gray-200 shadow-sm">
              {/* Decorative Waves Background */}
              <div className="absolute top-0 left-0 right-0 h-28 overflow-hidden pointer-events-none">
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="absolute w-full h-full">
                  <path d="M0,100 C150,140 350,60 500,100 L500,0 L0,0 Z" className="fill-[#13C1AC]/20"></path>
                </svg>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="absolute w-full h-full">
                  <path d="M0,70 C100,110 400,30 500,70 L500,0 L0,0 Z" className="fill-[#13C1AC]/10"></path>
                </svg>
              </div>
              
              <div className="p-4 relative z-10">
                {/* Filter Title */}
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#13C1AC] to-[#0ea895] flex items-center justify-center">
                    <Filter className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Filtre</h2>
                </div>
                {filterContent}
              </div>
            </div>
        </div>
    );
}

// Mobile Filter Sheet Component
function MobileFilterSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up overflow-x-hidden">
        {/* Wave Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg 
            className="absolute top-0 left-0 w-full h-64 text-[#13C1AC]/5"
            viewBox="0 0 1440 320" 
            preserveAspectRatio="none"
          >
            <path 
              fill="currentColor" 
              d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            />
          </svg>
          <svg 
            className="absolute top-12 left-0 w-full h-48 text-[#13C1AC]/[0.03]"
            viewBox="0 0 1440 320" 
            preserveAspectRatio="none"
          >
            <path 
              fill="currentColor" 
              d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,149.3C672,149,768,171,864,165.3C960,160,1056,128,1152,122.7C1248,117,1344,139,1392,149.3L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            />
          </svg>
          {/* Bottom wave decoration */}
          <svg 
            className="absolute bottom-0 left-0 w-full h-32 text-gray-50"
            viewBox="0 0 1440 320" 
            preserveAspectRatio="none"
          >
            <path 
              fill="currentColor" 
              d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>
        
        {/* Content */}
        <div className="relative">
          <div className="sticky top-0 bg-gradient-to-b from-white via-white to-transparent pt-3 pb-4 px-4 z-10">
            <div className="w-12 h-1.5 bg-gradient-to-r from-[#13C1AC]/40 to-[#13C1AC]/20 rounded-full mx-auto mb-2" />
          </div>
          <div className="p-4 pb-8 relative">
            <Suspense fallback={<div className="py-8 text-center text-gray-500">Se încarcă...</div>}>
              <SearchFiltersSidebar onClose={onClose} />
            </Suspense>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function SearchPage() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50 sm:bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
         {/* Mobile Filter Button - Fixed at bottom */}
         <button
           onClick={() => setShowMobileFilters(true)}
           className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 lg:hidden flex items-center gap-2 px-5 py-3 bg-[#13C1AC] text-white font-semibold rounded-full shadow-xl shadow-[#13C1AC]/30 active:scale-95 transition-all"
         >
           <SlidersHorizontal className="w-4 h-4" />
           Filtre
         </button>
         
         <div className="flex flex-col lg:flex-row lg:gap-8">
            
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block sticky top-24 h-fit">
                <Suspense fallback={<div className="w-64 h-96 bg-gray-100 rounded-xl animate-pulse" />}>
                   <SearchFiltersSidebar />
                </Suspense>
            </aside>

            <main className="flex-1 min-w-0 pb-20 lg:pb-0">
               <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13C1AC]"></div></div>}>
                 <SearchResults />
               </Suspense>
            </main>
         </div>
      </div>
      
      {/* Mobile Filter Sheet */}
      <MobileFilterSheet 
        isOpen={showMobileFilters} 
        onClose={() => setShowMobileFilters(false)} 
      />
    </div>
  );
}
