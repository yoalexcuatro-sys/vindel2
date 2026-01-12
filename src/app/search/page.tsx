
'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getProducts, Product } from '@/lib/products-service';
import ProductCard from '@/components/ProductCard';
import { Filter, SlidersHorizontal, MapPin, Tag, ChevronDown, X } from 'lucide-react';
import { localidades, Localidad } from '@/data/localidades';

// Separate component to wrap in Suspense because of useSearchParams
function SearchResults() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
  const locationParam = searchParams.get('location');
  const conditionParam = searchParams.get('condition'); // "new", "used", etc.

  // Filtering Logic
  const filteredProducts = products.filter((product) => {
    // Text Search
    const matchesText = 
        product.title.toLowerCase().includes(query.toLowerCase()) || 
        product.description.toLowerCase().includes(query.toLowerCase());
    
    // Price
    const matchesMinPrice = minPriceParam ? product.price >= Number(minPriceParam) : true;
    const matchesMaxPrice = maxPriceParam ? product.price <= Number(maxPriceParam) : true;

    // Location
    const matchesLocation = locationParam 
      ? product.location.toLowerCase().includes(locationParam.toLowerCase()) 
      : true;

    // Condition
    const matchesCondition = conditionParam 
        ? product.condition.toLowerCase() === conditionParam.toLowerCase() 
        : true;
    
    // Category (if present in product)
    const matchesCategory = categoryParam
        ? product.category === categoryParam
        : true;

    return matchesText && matchesMinPrice && matchesMaxPrice && matchesLocation && matchesCondition && matchesCategory;
  });

  if (loading) return <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#13C1AC] mx-auto"></div></div>;

  return (
    <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-800">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'rezultat' : 'rezultate'} 
                {query && <span> pentru "{query}"</span>}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Sortează după:</span>
                <select className="border-none bg-transparent font-medium text-gray-900 focus:ring-0 cursor-pointer">
                    <option>Relevanță</option>
                    <option>Preț: de la mic la mare</option>
                    <option>Preț: de la mare la mic</option>
                    <option>Cele mai recente</option>
                </select>
            </div>
        </div>

        {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                    <Filter className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Nu am găsit rezultate</h3>
                <p className="mt-1 text-gray-500">Încearcă alți termeni de căutare sau filtre mai puțin specifice.</p>
            </div>
        )}
    </div>
  );
}

// Sidebar Filters Component
function SearchFiltersSidebar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const ubicacionRef = useRef<HTMLDivElement>(null);
    
    // Local state for filters to avoid URL thrashing on every keystroke
    const [priceMin, setPriceMin] = useState(searchParams.get('minPrice') || '');
    const [priceMax, setPriceMax] = useState(searchParams.get('maxPrice') || '');
    const [location, setLocation] = useState(searchParams.get('location') || '');
    const [showUbicacionSugerencias, setShowUbicacionSugerencias] = useState(false);

    // Click outside to close suggestions
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ubicacionRef.current && !ubicacionRef.current.contains(event.target as Node)) {
                setShowUbicacionSugerencias(false);
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

    // Function to apply filters
    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (priceMin) params.set('minPrice', priceMin); else params.delete('minPrice');
        if (priceMax) params.set('maxPrice', priceMax); else params.delete('maxPrice');
        if (location) params.set('location', location); else params.delete('location');
        
        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="w-full lg:w-64 flex-shrink-0 space-y-8">
            
            {/* Price Filter */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Preț</h3>
                <div className="flex items-center space-x-2">
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">€</span>
                        </div>
                        <input
                            type="number"
                            placeholder="Min"
                            value={priceMin}
                            onChange={(e) => setPriceMin(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#13C1AC] sm:text-sm sm:leading-6"
                        />
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">€</span>
                        </div>
                        <input
                            type="number"
                            placeholder="Max"
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#13C1AC] sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>
            </div>

            {/* Location Filter */}
            <div ref={ubicacionRef}>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Locație</h3>
                <div className="relative">
                    <div className={`flex items-center rounded-md ring-1 ring-inset transition-all ${
                        location.includes(',')
                            ? 'bg-green-50 ring-green-300'
                            : 'ring-gray-300 focus-within:ring-2 focus-within:ring-[#13C1AC]'
                    }`}>
                        <div className="flex items-center pl-3">
                            <MapPin className={`h-4 w-4 ${location.includes(',') ? 'text-green-500' : 'text-gray-400'}`} />
                        </div>
                        <input
                            type="text"
                            placeholder="Oraș sau cod poștal"
                            value={location}
                            onChange={(e) => {
                                setLocation(e.target.value);
                                setShowUbicacionSugerencias(true);
                            }}
                            onFocus={() => setShowUbicacionSugerencias(true)}
                            className={`block w-full border-0 py-1.5 pl-2 pr-8 bg-transparent sm:text-sm sm:leading-6 focus:ring-0 outline-none ${
                                location.includes(',') ? 'text-green-700 font-medium' : 'text-gray-900'
                            }`}
                        />
                        {location && (
                            <button
                                type="button"
                                onClick={() => setLocation('')}
                                className={`mr-2 p-1 rounded-full transition-colors ${
                                    location.includes(',') ? 'hover:bg-green-200' : 'hover:bg-gray-200'
                                }`}
                            >
                                <X className={`w-3.5 h-3.5 ${location.includes(',') ? 'text-green-600' : 'text-gray-500'}`} />
                            </button>
                        )}
                    </div>
                    
                    {/* Suggestions dropdown */}
                    {showUbicacionSugerencias && localidadesFiltradas.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {localidadesFiltradas.map((loc, index) => (
                                <button
                                    key={`${loc.ciudad}-${loc.judet}-${index}`}
                                    type="button"
                                    onClick={() => handleSeleccionarUbicacion(loc)}
                                    className="w-full px-3 py-2.5 text-left hover:bg-[#13C1AC]/10 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-2"
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
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-gray-500 text-sm">
                            Nu s-au găsit rezultate
                        </div>
                    )}
                </div>
            </div>

             {/* Condition Filter (Static for demo) */}
             <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Stare</h3>
                <div className="space-y-2">
                    {['Nou', 'Ca nou', 'Bună', 'Folosit'].map((cond) => (
                        <div key={cond} className="flex items-center">
                            <input
                                id={`filter-${cond}`}
                                name="condition"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-[#13C1AC] focus:ring-[#13C1AC]"
                            />
                            <label htmlFor={`filter-${cond}`} className="ml-3 text-sm text-gray-600">
                                {cond}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <button 
                onClick={applyFilters}
                className="w-full bg-[#13C1AC] text-white font-medium py-2 rounded-lg hover:bg-[#0ea895] transition-colors"
            >
                Aplică filtre
            </button>
        </div>
    );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="flex flex-col lg:flex-row lg:space-x-8">
            
            {/* Mobile Filter Toggle could go here */}
            
            <aside className="hidden lg:block">
                <Suspense fallback={<div>Se încarcă filtrele...</div>}>
                   <SearchFiltersSidebar />
                </Suspense>
            </aside>

            <main className="flex-1">
               <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13C1AC]"></div></div>}>
                 <SearchResults />
               </Suspense>
            </main>

         </div>
      </div>
    </div>
  );
}
