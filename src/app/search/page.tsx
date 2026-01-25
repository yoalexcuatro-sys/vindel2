
'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getProducts, Product } from '@/lib/products-service';
import ProductCard from '@/components/ProductCard';
import { Filter, SlidersHorizontal, MapPin, Tag, ChevronDown, X, ChevronUp, Grid3X3, LayoutList, ArrowUpDown, Sparkles, Star, ThumbsUp, Package, Heart, Clock, CheckCircle, Home, Car, Briefcase, Wrench, Smartphone, Shirt, PawPrint, Armchair, Dumbbell, Baby, Plane, Gamepad2, Layers, Building2, TreeDeciduous, Store, Building, Warehouse, Key, BedDouble, Bike, Disc, Truck, Tractor, Ship, FileText, Users, Shield, Leaf, ShoppingCart, Search, Scissors, Hammer, Calculator, UtensilsCrossed, UserCircle, Utensils, Laptop, Monitor, Megaphone, Stethoscope, TrendingUp, GraduationCap, Globe, Tablet, Tv, Camera, Plug, Cpu, Footprints, ShoppingBag, Gem, Watch, Glasses, Fish, Tent, Map, Music, Bed, Ticket, Droplets, Zap } from 'lucide-react';
import { localidades, Localidad } from '@/data/localidades';
import Link from 'next/link';
import Image from 'next/image';
import { createProductLink } from '@/lib/slugs';

import { Timestamp } from 'firebase/firestore';

// Mapping from URL slug to actual category names (supports both formats)
const CATEGORY_SLUG_MAP: Record<string, string[]> = {
  'electronice': ['Electronice', 'electronice'],
  'auto-moto': ['Auto moto', 'auto-moto'],
  'moda': ['Modă și accesorii', 'moda'],
  'gaming': ['Videojocuri', 'gaming'],
  'sport': ['Timp liber și sport', 'sport'],
  'casa-gradina': ['Casă și grădină', 'casa-gradina'],
  'imobiliare': ['Imobiliare', 'imobiliare'],
  'locuri-de-munca': ['Locuri de muncă', 'locuri-de-munca'],
  'servicii': ['Servicii', 'servicii'],
  'animale': ['Animale de companie', 'animale'],
  'mama-copil': ['Mama și copilul', 'mama-copil'],
  'agro': ['Agro', 'agro'],
};

// Subcategories by category with icons
interface SubcategoryItem {
  name: string;
  icon: any;
}

const SUBCATEGORIES: Record<string, SubcategoryItem[]> = {
  'imobiliare': [
    { name: 'Apartamente', icon: Building2 },
    { name: 'Case / Vile', icon: Home },
    { name: 'Terenuri', icon: TreeDeciduous },
    { name: 'Spații comerciale', icon: Store },
    { name: 'Birouri', icon: Building },
    { name: 'Garaje / Parcări', icon: Warehouse },
    { name: 'Închirieri', icon: Key },
    { name: 'Camere de închiriat', icon: BedDouble }
  ],
  'auto-moto': [
    { name: 'Autoturisme', icon: Car },
    { name: 'Moto', icon: Bike },
    { name: 'Anvelope', icon: Disc },
    { name: 'Jante / Roți', icon: Disc },
    { name: 'Piese și accesorii', icon: Wrench },
    { name: 'Transport', icon: Truck },
    { name: 'Utilaje', icon: Tractor },
    { name: 'Camioane', icon: Truck },
    { name: 'Rulote', icon: Truck },
    { name: 'Bărci / Ambarcațiuni', icon: Ship }
  ],
  'locuri-de-munca': [
    { name: 'Administratie', icon: FileText },
    { name: 'Agenti - consultanti vanzari', icon: Users },
    { name: 'IT - Telecomunicatii', icon: Laptop },
    { name: 'Horeca', icon: UtensilsCrossed },
    { name: 'Constructii', icon: Hammer },
    { name: 'Transporturi', icon: Truck }
  ],
  'matrimoniale': [],
  'servicii': [
    { name: 'Construcții', icon: Hammer },
    { name: 'Reparații', icon: Wrench },
    { name: 'Transport', icon: Truck },
    { name: 'Curățenie', icon: Home },
    { name: 'IT / Web', icon: Laptop },
    { name: 'Evenimente', icon: Star },
    { name: 'Educație / Meditații', icon: GraduationCap }
  ],
  'electronice': [
    { name: 'Telefoane', icon: Smartphone },
    { name: 'Laptopuri', icon: Laptop },
    { name: 'Calculatoare', icon: Monitor },
    { name: 'Tablete', icon: Tablet },
    { name: 'TV / Audio', icon: Tv },
    { name: 'Foto / Video', icon: Camera },
    { name: 'Electrocasnice', icon: Plug },
    { name: 'Componente PC', icon: Cpu },
    { name: 'Console / Gaming', icon: Gamepad2 },
    { name: 'Accesorii', icon: Smartphone }
  ],
  'moda': [
    { name: 'Îmbrăcăminte femei', icon: Shirt },
    { name: 'Îmbrăcăminte bărbați', icon: Shirt },
    { name: 'Încălțăminte', icon: Footprints },
    { name: 'Genți', icon: ShoppingBag },
    { name: 'Bijuterii', icon: Gem },
    { name: 'Ceasuri', icon: Watch },
    { name: 'Ochelari', icon: Glasses }
  ],
  'animale': [
    { name: 'Câini', icon: PawPrint },
    { name: 'Pisici', icon: PawPrint },
    { name: 'Păsări', icon: PawPrint },
    { name: 'Pești', icon: Fish },
    { name: 'Accesorii animale', icon: PawPrint }
  ],
  'casa-gradina': [
    { name: 'Mobilier', icon: Armchair },
    { name: 'Decorațiuni', icon: Home },
    { name: 'Electrocasnice', icon: Plug },
    { name: 'Grădinărit', icon: TreeDeciduous },
    { name: 'Unelte', icon: Hammer },
    { name: 'Scule electrice', icon: Zap }
  ],
  'sport': [
    { name: 'Fitness', icon: Dumbbell },
    { name: 'Ciclism', icon: Bike },
    { name: 'Camping', icon: Tent },
    { name: 'Pescuit / Vânătoare', icon: Fish }
  ],
  'copii': [
    { name: 'Îmbrăcăminte copii', icon: Shirt },
    { name: 'Jucării', icon: Gamepad2 },
    { name: 'Cărucioare', icon: Baby },
    { name: 'Mobilier copii', icon: Bed }
  ],
  'turism': [
    { name: 'Hoteluri', icon: Bed },
    { name: 'Pensiuni', icon: Home },
    { name: 'Camping', icon: Tent },
    { name: 'Excursii', icon: Map },
    { name: 'Bilete / Vouchere', icon: Ticket }
  ],
  'gaming': [
    { name: 'PlayStation', icon: Gamepad2 },
    { name: 'Xbox', icon: Gamepad2 },
    { name: 'Nintendo', icon: Gamepad2 },
    { name: 'PC Gaming', icon: Monitor },
    { name: 'Jocuri', icon: Disc },
    { name: 'Accesorii gaming', icon: Gamepad2 }
  ],
};

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
function SearchResults({ onOpenFilters }: { onOpenFilters: () => void }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevant');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showSubcategoryMenu, setShowSubcategoryMenu] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const subcategoryRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState(1);

  // Listen for theme changes
  useEffect(() => {
    const loadTheme = () => {
      const saved = localStorage.getItem('user_card_theme');
      if (saved) setCurrentTheme(parseInt(saved));
    };
    loadTheme();
    window.addEventListener('themeChange', loadTheme);
    return () => window.removeEventListener('themeChange', loadTheme);
  }, []);

  // Close subcategory menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (subcategoryRef.current && !subcategoryRef.current.contains(event.target as Node)) {
        setShowSubcategoryMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadProducts() {
      try {
        // Load all products (increased limit to get all available)
        const result = await getProducts({}, 1000);
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
  const subcategoryParam = searchParams.get('subcategory') || ''; // Subcategoría desde URL
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const currencyParam = searchParams.get('currency') || ''; // EUR or RON - empty means no currency filter
  const locationParam = searchParams.get('location');
  const conditionParam = searchParams.get('condition'); // "new", "used", etc.
  const negotiableParam = searchParams.get('negotiable') === 'true';

  // Sincronizar subcategoría desde URL o reset cuando cambia categoría
  useEffect(() => {
    if (subcategoryParam) {
      setSelectedSubcategory(subcategoryParam);
    } else {
      setSelectedSubcategory(null);
    }
  }, [categoryParam, subcategoryParam]);

  // Filtering Logic
  const filteredProducts = products.filter((product) => {
    // Text Search - improved to search for ALL words individually
    // "bara audi" will find "Bara fata audi a5" because both "bara" AND "audi" are present
    // Also handles location search like "slatina olt" -> matches "Slatina, Olt"
    const matchesText = (() => {
      if (!query) return true;
      
      const searchWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const titleLower = product.title.toLowerCase();
      const descLower = product.description?.toLowerCase() || '';
      // Normalize location - remove comma for better matching
      const locationLower = (product.location?.toLowerCase() || '').replace(/,/g, ' ').replace(/\s+/g, ' ');
      const combinedText = `${titleLower} ${descLower} ${locationLower}`;
      
      // ALL search words must be present somewhere in title, description, or location
      return searchWords.every(word => combinedText.includes(word));
    })();
    
    // Currency filter - if filtering by price, only show products in that currency
    const productCurrency = product.currency || 'RON';
    const matchesCurrency = currencyParam 
      ? productCurrency === currencyParam 
      : true;
    
    // Price - only compare if currencies match
    const matchesMinPrice = minPriceParam && matchesCurrency ? product.price >= Number(minPriceParam) : true;
    const matchesMaxPrice = maxPriceParam && matchesCurrency ? product.price <= Number(maxPriceParam) : true;

    // Location - strict city matching
    // "Slatina, Olt" should only match "Slatina, Olt", not "Balș, Olt"
    const matchesLocation = (() => {
      if (!locationParam) return true;
      
      const productLoc = product.location?.toLowerCase() || '';
      const searchLoc = locationParam.toLowerCase();
      
      // Direct exact match first
      if (productLoc === searchLoc) return true;
      
      // Split by comma to get city and county
      const searchParts = searchLoc.split(',').map(p => p.trim()).filter(p => p.length > 0);
      const productParts = productLoc.split(',').map(p => p.trim()).filter(p => p.length > 0);
      
      // If searching with city + county (e.g., "Slatina, Olt")
      // Only match if the city matches exactly
      if (searchParts.length > 0 && productParts.length > 0) {
        const searchCity = searchParts[0];
        const productCity = productParts[0];
        
        // City must match exactly
        if (productCity === searchCity) return true;
      }
      
      return false;
    })();

    // Condition - support multiple conditions separated by comma
    const matchesCondition = conditionParam 
        ? conditionParam.split(',').some(cond => product.condition?.toLowerCase() === cond.toLowerCase())
        : true;
    
    // Category - support multiple categories separated by comma (case-insensitive)
    // Also supports URL slug format mapping to actual category names
    const matchesCategory = categoryParam
        ? categoryParam.split(',').some(cat => {
            const catLower = cat.toLowerCase();
            const productCatLower = product.category?.toLowerCase() || '';
            // Direct match
            if (productCatLower === catLower) return true;
            // Check slug mapping
            const mappedNames = CATEGORY_SLUG_MAP[catLower];
            if (mappedNames) {
              return mappedNames.some(name => name.toLowerCase() === productCatLower);
            }
            return false;
          })
        : true;

    // Subcategory filter
    const matchesSubcategory = selectedSubcategory
        ? product.subcategory === selectedSubcategory
        : true;

    // Negotiable
    const matchesNegotiable = negotiableParam ? product.negotiable === true : true;

    return matchesText && matchesCurrency && matchesMinPrice && matchesMaxPrice && matchesLocation && matchesCondition && matchesCategory && matchesSubcategory && matchesNegotiable;
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
    <div className="flex flex-col space-y-3 sm:space-y-6">
      {/* Skeleton Header - Mobile optimized */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="h-5 sm:h-7 w-32 sm:w-48 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="flex items-center gap-2">
          <div className="h-8 sm:h-9 w-20 sm:w-28 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-8 sm:h-9 w-16 sm:w-20 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      </div>
      {/* Skeleton Grid - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-3 border border-gray-100 shadow-sm">
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-lg sm:rounded-xl mb-1.5 sm:mb-3 animate-pulse"></div>
            <div className="h-2.5 sm:h-4 bg-gray-200 rounded w-3/4 mb-1 sm:mb-2 animate-pulse"></div>
            <div className="h-2 sm:h-3 bg-gray-100 rounded w-1/2 mb-1.5 sm:mb-3 animate-pulse"></div>
            <div className="flex justify-between items-center pt-0.5 sm:pt-2">
              <div className="h-3.5 sm:h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-5 sm:h-8 bg-gray-100 rounded w-10 sm:w-16 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-3 sm:space-y-6">
        <style jsx>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes cardFadeIn {
            from { 
              opacity: 0;
              transform: translateY(15px) scale(0.95);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes listFadeIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-fadeInUp { animation: fadeInUp 0.4s ease-out forwards; }
          .animate-card { animation: cardFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
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
        <div className="flex flex-col gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-gray-100 animate-fadeInUp relative z-20">
            {/* Results count + Controls Row - Same line on mobile */}
            <div className="flex items-center justify-between gap-2 relative z-30 w-full">
              {/* Left side: Results count */}
              <h1 className="text-base sm:text-xl font-bold text-gray-900 flex-shrink-0">
                  <span className="text-[#13C1AC]">{sortedProducts.length}</span>
                  <span className="text-gray-600 font-medium"> rezultate</span>
              </h1>
              
              {/* Right side: Controls */}
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <div className="relative z-[100]">
                  <button 
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:border-[#13C1AC] hover:shadow-sm active:scale-[0.98] transition-all shadow-sm"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#13C1AC]" />
                    <span className="hidden sm:inline">{sortOptions.find(o => o.value === sortBy)?.label || 'Sortare'}</span>
                    <span className="sm:hidden">{sortOptions.find(o => o.value === sortBy)?.label.split(' ')[0] || 'Sortare'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showSortMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-[90]" 
                        onClick={() => setShowSortMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] overflow-hidden">
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
                
                {/* Subcategory Dropdown */}
                {categoryParam && SUBCATEGORIES[categoryParam] && (
                  <div className="relative z-[90]" ref={subcategoryRef}>
                    <button 
                      onClick={() => setShowSubcategoryMenu(!showSubcategoryMenu)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border rounded-xl text-xs sm:text-sm font-medium hover:shadow-sm active:scale-[0.98] transition-all shadow-sm ${
                        selectedSubcategory 
                          ? 'border-[#13C1AC] text-[#13C1AC]' 
                          : 'border-gray-200 text-gray-700 hover:border-[#13C1AC]'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="max-w-[60px] sm:max-w-none truncate">{selectedSubcategory || 'Sub.'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-200 ${showSubcategoryMenu ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showSubcategoryMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-[80]" 
                          onClick={() => setShowSubcategoryMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-[90] overflow-hidden max-h-72 overflow-y-auto">
                          <div className="py-1">
                            <button
                              onClick={() => { setSelectedSubcategory(null); setShowSubcategoryMenu(false); }}
                              className={`w-full px-4 py-2.5 text-left text-sm transition-all flex items-center gap-3 ${
                                !selectedSubcategory 
                                  ? 'bg-gradient-to-r from-[#13C1AC]/10 to-transparent text-[#13C1AC] font-semibold' 
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <Layers className="w-4 h-4" />
                              <span>Toate subcategoriile</span>
                              {!selectedSubcategory && (
                                <span className="ml-auto w-2 h-2 bg-[#13C1AC] rounded-full"></span>
                              )}
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            {SUBCATEGORIES[categoryParam].map((subcat) => {
                              const SubIcon = subcat.icon;
                              return (
                                <button
                                  key={subcat.name}
                                  onClick={() => { setSelectedSubcategory(subcat.name); setShowSubcategoryMenu(false); }}
                                  className={`w-full px-4 py-2.5 text-left text-sm transition-all flex items-center gap-3 ${
                                    selectedSubcategory === subcat.name 
                                      ? 'bg-gradient-to-r from-[#13C1AC]/10 to-transparent text-[#13C1AC] font-semibold' 
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }`}
                                >
                                  <SubIcon className="w-4 h-4" />
                                  <span>{subcat.name}</span>
                                  {selectedSubcategory === subcat.name && (
                                    <span className="ml-auto w-2 h-2 bg-[#13C1AC] rounded-full"></span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Mobile Filter Button - Inline */}
                <button
                  onClick={onOpenFilters}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 sm:py-2.5 bg-[#13C1AC] text-white font-medium rounded-xl text-xs sm:text-sm hover:bg-[#10a593] active:scale-[0.98] transition-all shadow-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Filtre</span>
                </button>
                
                {/* View Toggle - At the end */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 sm:p-2.5 transition-all ${viewMode === 'grid' ? 'bg-[#13C1AC] text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 sm:h-5 bg-gray-200"></div>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 sm:p-2.5 transition-all ${viewMode === 'list' ? 'bg-[#13C1AC] text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Category/Location badges - Second row */}
            {categoryParam && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-medium text-[#13C1AC] bg-[#13C1AC]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {categoryParam}
                </span>
                {locationParam && (
                  <span className="text-[10px] sm:text-xs font-medium text-[#13C1AC] bg-[#13C1AC]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {locationParam}
                  </span>
                )}
              </div>
            )}
            {!categoryParam && locationParam && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-medium text-[#13C1AC] bg-[#13C1AC]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {locationParam}
                </span>
              </div>
            )}
            {query && (
              <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full truncate max-w-[200px] sm:max-w-none self-start">
                "{query}"
              </span>
            )}
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
                      key={`${product.id}-theme-${currentTheme}`}
                      href={createProductLink(product)}
                      className="group flex bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#13C1AC]/30 animate-listFadeIn"
                      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
                    >
                      {/* Image - Clean, no overlays */}
                      <div className="relative w-28 sm:w-44 md:w-52 flex-shrink-0 aspect-square">
                        <Image
                          src={product.image || '/placeholder.jpg'}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 112px, (max-width: 768px) 176px, 208px"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 p-2 sm:p-4 flex flex-col justify-between min-w-0">
                        <div>
                          {/* Title */}
                          <h3 className="font-semibold text-gray-900 text-xs sm:text-base line-clamp-2 group-hover:text-[#13C1AC] transition-colors leading-tight">
                            {product.title}
                          </h3>
                          
                          {/* Location & Time */}
                          <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-gray-500">
                            <span className="flex items-center gap-0.5 sm:gap-1 truncate">
                              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                              <span className="truncate">{product.location}</span>
                            </span>
                            <span className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              {timeAgo}
                            </span>
                          </div>
                          
                          {/* Description preview - truncated to 300 chars */}
                          {product.description && (
                            <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-gray-500 line-clamp-2 sm:line-clamp-3">
                              {product.description.length > 300 
                                ? `${product.description.substring(0, 300)}...` 
                                : product.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Bottom: Price, Condition & Favorite */}
                        <div className="flex items-center justify-between mt-1.5 sm:mt-3">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <div className="flex items-baseline">
                              <span className="text-sm sm:text-xl font-bold text-[#13C1AC]">
                                {product.price?.toLocaleString('ro-RO')}
                              </span>
                              <span className="text-[10px] sm:text-base font-semibold text-[#13C1AC] ml-0.5 sm:ml-1">
                                {product.currency === 'EUR' ? '€' : 'lei'}
                              </span>
                            </div>
                            {product.negotiable && (
                              <span className="hidden sm:inline text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                Negociabil
                              </span>
                            )}
                            {/* Condition Badge */}
                            {conditionInfo && (
                              <span className={`hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold ${conditionInfo.color}`}>
                                {conditionInfo.label}
                              </span>
                            )}
                          </div>
                          
                          {/* Right side: Favorite & View */}
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-[#13C1AC] opacity-0 group-hover:opacity-100 transition-opacity">
                              Vezi detalii
                              <ChevronDown className="w-3 h-3 -rotate-90" />
                            </span>
                            {/* Favorite Button */}
                            <button 
                              onClick={(e) => { e.preventDefault(); }}
                              className="p-1 sm:p-1.5 bg-gray-100 hover:bg-red-50 rounded-full hover:scale-110 transition-all"
                            >
                              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 hover:text-red-500" />
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
                {sortedProducts.map((product) => (
                    <div 
                      key={`${product.id}-theme-${currentTheme}`} 
                      className="animate-card"
                    >
                      <ProductCard product={product} />
                    </div>
                ))}
              </div>
            )
        ) : (
            <div className="text-center py-10 sm:py-20 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm animate-fadeInUp mx-1">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1">Nu am găsit rezultate</h3>
                <p className="text-xs sm:text-sm text-gray-500 px-4 max-w-xs mx-auto">Încearcă alți termeni sau filtre mai puțin specifice</p>
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
    const locationInputRef = useRef<HTMLInputElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    
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
      // Update local state
      const newCategories = selectedCategories.includes(catId) 
        ? selectedCategories.filter(c => c !== catId) 
        : [catId]; // Only allow one category at a time for subcategory filtering
      
      setSelectedCategories(newCategories);
      
      // Also update URL immediately so subcategory selector updates
      const params = new URLSearchParams(searchParams.toString());
      if (newCategories.length > 0) {
        params.set('category', newCategories.join(','));
      } else {
        params.delete('category');
      }
      router.push(`/search?${params.toString()}`, { scroll: false });
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

    // Update dropdown position when showing suggestions
    const updateDropdownPosition = () => {
        if (locationInputRef.current) {
            const rect = locationInputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left,
                width: rect.width
            });
        }
    };

    // Update position when suggestions change or on scroll
    useEffect(() => {
        if (showUbicacionSugerencias && localidadesFiltradas.length > 0) {
            updateDropdownPosition();
        }
    }, [showUbicacionSugerencias, localidadesFiltradas.length]);

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
                            // Update URL immediately - clear query when changing category
                            const params = new URLSearchParams(searchParams.toString());
                            params.delete('category');
                            params.delete('q'); // Clear search query when browsing categories
                            router.push(`/search?${params.toString()}`, { scroll: false });
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
                                // Update URL immediately - clear query when changing category
                                const params = new URLSearchParams(searchParams.toString());
                                params.set('category', cat.id);
                                params.delete('q'); // Clear search query when browsing categories
                                router.push(`/search?${params.toString()}`, { scroll: false });
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
            <div ref={ubicacionRef} className="p-2.5 relative">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#13C1AC] rounded-full"></span>
                  Locație
                </h3>
                <div>
                    <div 
                        ref={locationInputRef}
                        className={`group flex items-center rounded-xl transition-all duration-200 ${
                        location.includes(',')
                            ? 'bg-gradient-to-r from-[#13C1AC]/10 to-teal-50 ring-2 ring-[#13C1AC]/30 shadow-sm'
                            : 'bg-gray-50 hover:bg-white ring-1 ring-gray-200 hover:ring-[#13C1AC]/40 focus-within:ring-2 focus-within:ring-[#13C1AC] focus-within:bg-white focus-within:shadow-md'
                    }`}>
                        <div className={`flex items-center justify-center w-10 h-10 ml-1 rounded-lg transition-all duration-200 ${
                            location.includes(',') 
                                ? 'bg-[#13C1AC] shadow-sm' 
                                : 'bg-white group-hover:bg-[#13C1AC]/10 group-focus-within:bg-[#13C1AC]'
                        }`}>
                            <MapPin className={`h-4 w-4 transition-colors duration-200 ${
                                location.includes(',') 
                                    ? 'text-white' 
                                    : 'text-gray-400 group-hover:text-[#13C1AC] group-focus-within:text-white'
                            }`} />
                        </div>
                        <input
                            type="text"
                            placeholder="Caută oraș sau județ..."
                            value={location}
                            onChange={(e) => {
                                setLocation(e.target.value);
                                setShowUbicacionSugerencias(true);
                                updateDropdownPosition();
                            }}
                            onFocus={() => {
                                setShowUbicacionSugerencias(true);
                                updateDropdownPosition();
                            }}
                            className={`block w-full border-0 py-3 px-3 bg-transparent text-sm focus:ring-0 outline-none font-medium transition-colors ${
                                location.includes(',') ? 'text-[#13C1AC]' : 'text-gray-900 placeholder:text-gray-400'
                            }`}
                        />
                        {location && (
                            <button
                                type="button"
                                onClick={() => setLocation('')}
                                className={`mr-2 p-1.5 rounded-full transition-all duration-200 active:scale-90 ${
                                    location.includes(',') 
                                        ? 'bg-[#13C1AC]/20 hover:bg-[#13C1AC]/30 text-[#13C1AC]' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Location dropdown - fixed position portal */}
                {showUbicacionSugerencias && localidadesFiltradas.length > 0 && dropdownPosition.width > 0 && (
                    <div 
                        className="fixed z-[9999] bg-white border border-gray-100 rounded-xl shadow-2xl max-h-56 overflow-y-auto"
                        style={{
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            width: dropdownPosition.width
                        }}
                    >
                        <div className="p-1.5">
                            {localidadesFiltradas.map((loc, index) => (
                                <button
                                    key={`${loc.ciudad}-${loc.judet}-${index}`}
                                    type="button"
                                    onClick={() => handleSeleccionarUbicacion(loc)}
                                    className="w-full px-3 py-2.5 text-left hover:bg-gradient-to-r hover:from-[#13C1AC]/10 hover:to-transparent rounded-lg transition-all duration-150 flex items-center gap-3 active:scale-[0.98] group/item"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover/item:bg-[#13C1AC] flex items-center justify-center transition-colors">
                                        <MapPin className="w-4 h-4 text-gray-400 group-hover/item:text-white transition-colors" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900 text-sm">{loc.ciudad}</span>
                                        <span className="text-xs text-gray-500">{loc.judet}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* No results message - fixed portal */}
                {showUbicacionSugerencias && location.length >= 2 && localidadesFiltradas.length === 0 && !location.includes(',') && dropdownPosition.width > 0 && (
                    <div 
                        className="fixed z-[9999] bg-white border border-gray-100 rounded-xl shadow-2xl p-4"
                        style={{
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            width: dropdownPosition.width
                        }}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                <MapPin className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-sm">Nu s-au găsit rezultate</p>
                            <p className="text-gray-400 text-xs mt-0.5">Încearcă altă căutare</p>
                        </div>
                    </div>
                )}
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
        <div className="w-full flex-shrink-0">
            <div className="rounded-2xl relative bg-white border border-gray-200 shadow-sm overflow-visible">
              {/* Decorative Waves Background */}
              <div className="absolute top-0 left-0 right-0 h-28 overflow-hidden pointer-events-none rounded-t-2xl">
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="absolute w-full h-full">
                  <path d="M0,100 C150,140 350,60 500,100 L500,0 L0,0 Z" className="fill-[#13C1AC]/20"></path>
                </svg>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="absolute w-full h-full">
                  <path d="M0,70 C100,110 400,30 500,70 L500,0 L0,0 Z" className="fill-[#13C1AC]/10"></path>
                </svg>
              </div>
              
              <div className="p-4 relative z-10 overflow-visible">
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] max-h-[80vh] overflow-y-auto animate-slide-up overflow-x-hidden shadow-2xl">
        {/* Handle bar */}
        <div className="sticky top-0 bg-white pt-3 pb-2 px-4 z-10 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#13C1AC]" />
              Filtre
            </h2>
            <button 
              onClick={onClose}
              className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 pb-8">
          <Suspense fallback={<div className="py-8 text-center text-gray-500">Se încarcă...</div>}>
            <SearchFiltersSidebar onClose={onClose} />
          </Suspense>
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
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar - Always visible on desktop */}
      <div className="hidden lg:block fixed top-20 left-[max(1rem,calc((100vw-80rem)/2+1rem))] w-80 z-30 max-h-[calc(100vh-6rem)] overflow-visible">
        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto overflow-x-visible pr-2 -mr-2">
          <Suspense fallback={<div className="w-full h-96 bg-gray-100 rounded-xl animate-pulse" />}>
            <SearchFiltersSidebar />
          </Suspense>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-8 sm:pt-6 lg:pt-8 pb-24 md:pb-8">
         {/* Mobile Filter Button - Now inline in header, this is hidden */}
         
         <div className="flex flex-col lg:flex-row lg:gap-8">
            
            {/* Spacer for fixed sidebar on desktop */}
            <div className="hidden lg:block w-80 flex-shrink-0" />

            <main className="flex-1 min-w-0 pb-20 lg:pb-0">
               <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13C1AC]"></div></div>}>
                 <SearchResults onOpenFilters={() => setShowMobileFilters(true)} />
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
