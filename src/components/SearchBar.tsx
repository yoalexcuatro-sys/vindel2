
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Clock, Layers } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchSuggestion {
  term: string;
  category: string;
  categorySlug: string;
  subcategory?: string;
  type: 'term' | 'subcategory'; // tipo de sugerencia
}

// Subcategorías por categoría (para búsqueda directa por subcategoría)
const SUBCATEGORIES_DATA: Record<string, { name: string; slug: string }[]> = {
  'imobiliare': [
    { name: 'Apartamente', slug: 'Apartamente' },
    { name: 'Case / Vile', slug: 'Case / Vile' },
    { name: 'Terenuri', slug: 'Terenuri' },
    { name: 'Spații comerciale', slug: 'Spații comerciale' },
    { name: 'Birouri', slug: 'Birouri' },
    { name: 'Garaje / Parcări', slug: 'Garaje / Parcări' },
    { name: 'Închirieri', slug: 'Închirieri' },
    { name: 'Camere de închiriat', slug: 'Camere de închiriat' }
  ],
  'auto-moto': [
    { name: 'Autoturisme', slug: 'Autoturisme' },
    { name: 'Moto', slug: 'Moto' },
    { name: 'Anvelope', slug: 'Anvelope' },
    { name: 'Jante / Roți', slug: 'Jante / Roți' },
    { name: 'Piese și accesorii', slug: 'Piese și accesorii' },
    { name: 'Transport', slug: 'Transport' },
    { name: 'Utilaje', slug: 'Utilaje' },
    { name: 'Camioane', slug: 'Camioane' },
    { name: 'Rulote', slug: 'Rulote' },
    { name: 'Bărci / Ambarcațiuni', slug: 'Bărci / Ambarcațiuni' }
  ],
  'electronice': [
    { name: 'Telefoane', slug: 'Telefoane' },
    { name: 'Laptopuri', slug: 'Laptopuri' },
    { name: 'Calculatoare', slug: 'Calculatoare' },
    { name: 'Tablete', slug: 'Tablete' },
    { name: 'TV / Audio', slug: 'TV / Audio' },
    { name: 'Foto / Video', slug: 'Foto / Video' },
    { name: 'Electrocasnice', slug: 'Electrocasnice' },
    { name: 'Componente PC', slug: 'Componente PC' },
    { name: 'Console / Gaming', slug: 'Console / Gaming' },
    { name: 'Accesorii', slug: 'Accesorii' }
  ],
  'moda': [
    { name: 'Îmbrăcăminte femei', slug: 'Îmbrăcăminte femei' },
    { name: 'Îmbrăcăminte bărbați', slug: 'Îmbrăcăminte bărbați' },
    { name: 'Încălțăminte', slug: 'Încălțăminte' },
    { name: 'Genți', slug: 'Genți' },
    { name: 'Bijuterii', slug: 'Bijuterii' },
    { name: 'Ceasuri', slug: 'Ceasuri' },
    { name: 'Ochelari', slug: 'Ochelari' }
  ],
  'animale': [
    { name: 'Câini', slug: 'Câini' },
    { name: 'Pisici', slug: 'Pisici' },
    { name: 'Păsări', slug: 'Păsări' },
    { name: 'Pești', slug: 'Pești' },
    { name: 'Accesorii animale', slug: 'Accesorii animale' }
  ],
  'casa-gradina': [
    { name: 'Mobilier', slug: 'Mobilier' },
    { name: 'Decorațiuni', slug: 'Decorațiuni' },
    { name: 'Electrocasnice', slug: 'Electrocasnice' },
    { name: 'Grădinărit', slug: 'Grădinărit' },
    { name: 'Unelte', slug: 'Unelte' },
    { name: 'Scule electrice', slug: 'Scule electrice' }
  ],
  'sport': [
    { name: 'Fitness', slug: 'Fitness' },
    { name: 'Ciclism', slug: 'Ciclism' },
    { name: 'Camping', slug: 'Camping' },
    { name: 'Pescuit / Vânătoare', slug: 'Pescuit / Vânătoare' }
  ],
  'copii': [
    { name: 'Îmbrăcăminte copii', slug: 'Îmbrăcăminte copii' },
    { name: 'Jucării', slug: 'Jucării' },
    { name: 'Cărucioare', slug: 'Cărucioare' },
    { name: 'Mobilier copii', slug: 'Mobilier copii' }
  ],
  'turism': [
    { name: 'Hoteluri', slug: 'Hoteluri' },
    { name: 'Pensiuni', slug: 'Pensiuni' },
    { name: 'Camping', slug: 'Camping' },
    { name: 'Excursii', slug: 'Excursii' },
    { name: 'Bilete / Vouchere', slug: 'Bilete / Vouchere' }
  ],
  'gaming': [
    { name: 'PlayStation', slug: 'PlayStation' },
    { name: 'Xbox', slug: 'Xbox' },
    { name: 'Nintendo', slug: 'Nintendo' },
    { name: 'PC Gaming', slug: 'PC Gaming' },
    { name: 'Jocuri', slug: 'Jocuri' },
    { name: 'Accesorii gaming', slug: 'Accesorii gaming' }
  ],
  'locuri-de-munca': [
    { name: 'Administratie', slug: 'Administratie' },
    { name: 'IT - Telecomunicatii', slug: 'IT - Telecomunicatii' },
    { name: 'Horeca', slug: 'Horeca' },
    { name: 'Constructii', slug: 'Constructii' },
    { name: 'Transporturi', slug: 'Transporturi' }
  ],
  'servicii': [
    { name: 'Construcții', slug: 'Construcții' },
    { name: 'Reparații', slug: 'Reparații' },
    { name: 'Transport', slug: 'Transport' },
    { name: 'Curățenie', slug: 'Curățenie' },
    { name: 'IT / Web', slug: 'IT / Web' },
    { name: 'Evenimente', slug: 'Evenimente' },
    { name: 'Educație / Meditații', slug: 'Educație / Meditații' }
  ],
};

// Nombres de categorías para mostrar
const CATEGORY_NAMES: Record<string, string> = {
  'imobiliare': 'Imobiliare',
  'auto-moto': 'Auto & Moto',
  'electronice': 'Electronice',
  'moda': 'Modă',
  'animale': 'Animale',
  'casa-gradina': 'Casă & Grădină',
  'sport': 'Sport',
  'copii': 'Copii',
  'turism': 'Turism',
  'gaming': 'Gaming',
  'locuri-de-munca': 'Locuri de muncă',
  'servicii': 'Servicii',
};

// Sugerencias populares con categorías (términos de búsqueda)
const popularTermSuggestions: SearchSuggestion[] = [
  { term: 'iphone', category: 'Electronice', categorySlug: 'electronice', subcategory: 'Telefoane', type: 'term' },
  { term: 'iphone 13', category: 'Electronice', categorySlug: 'electronice', subcategory: 'Telefoane', type: 'term' },
  { term: 'iphone 14', category: 'Electronice', categorySlug: 'electronice', subcategory: 'Telefoane', type: 'term' },
  { term: 'iphone 15', category: 'Electronice', categorySlug: 'electronice', subcategory: 'Telefoane', type: 'term' },
  { term: 'samsung', category: 'Electronice', categorySlug: 'electronice', subcategory: 'Telefoane', type: 'term' },
  { term: 'samsung galaxy', category: 'Electronice', categorySlug: 'electronice', subcategory: 'Telefoane', type: 'term' },
  { term: 'laptop', category: 'Electronice', categorySlug: 'electronice', subcategory: 'Laptopuri', type: 'term' },
  { term: 'macbook', category: 'Electronice', categorySlug: 'electronice', subcategory: 'Laptopuri', type: 'term' },
  { term: 'playstation', category: 'Gaming', categorySlug: 'gaming', subcategory: 'PlayStation', type: 'term' },
  { term: 'ps5', category: 'Gaming', categorySlug: 'gaming', subcategory: 'PlayStation', type: 'term' },
  { term: 'xbox', category: 'Gaming', categorySlug: 'gaming', subcategory: 'Xbox', type: 'term' },
  { term: 'nintendo switch', category: 'Gaming', categorySlug: 'gaming', subcategory: 'Nintendo', type: 'term' },
  { term: 'bicicleta', category: 'Sport', categorySlug: 'sport', subcategory: 'Ciclism', type: 'term' },
  { term: 'trotineta', category: 'Sport', categorySlug: 'sport', subcategory: 'Ciclism', type: 'term' },
  { term: 'canapea', category: 'Casă & Grădină', categorySlug: 'casa-gradina', subcategory: 'Mobilier', type: 'term' },
  { term: 'masina', category: 'Auto & Moto', categorySlug: 'auto-moto', subcategory: 'Autoturisme', type: 'term' },
  { term: 'audi', category: 'Auto & Moto', categorySlug: 'auto-moto', subcategory: 'Autoturisme', type: 'term' },
  { term: 'bmw', category: 'Auto & Moto', categorySlug: 'auto-moto', subcategory: 'Autoturisme', type: 'term' },
  { term: 'volkswagen', category: 'Auto & Moto', categorySlug: 'auto-moto', subcategory: 'Autoturisme', type: 'term' },
  { term: 'apartament', category: 'Imobiliare', categorySlug: 'imobiliare', subcategory: 'Apartamente', type: 'term' },
  { term: 'garsoniera', category: 'Imobiliare', categorySlug: 'imobiliare', subcategory: 'Apartamente', type: 'term' },
  { term: 'casa', category: 'Imobiliare', categorySlug: 'imobiliare', subcategory: 'Case / Vile', type: 'term' },
];

// Generar sugerencias de subcategorías
const generateSubcategorySuggestions = (): SearchSuggestion[] => {
  const suggestions: SearchSuggestion[] = [];
  Object.entries(SUBCATEGORIES_DATA).forEach(([categorySlug, subcategories]) => {
    const categoryName = CATEGORY_NAMES[categorySlug] || categorySlug;
    subcategories.forEach(sub => {
      suggestions.push({
        term: sub.name.toLowerCase(),
        category: categoryName,
        categorySlug: categorySlug,
        subcategory: sub.name,
        type: 'subcategory'
      });
    });
  });
  return suggestions;
};

const subcategorySuggestions = generateSubcategorySuggestions();

// Combinar todas las sugerencias
const allSuggestions = [...popularTermSuggestions, ...subcategorySuggestions];

interface SearchBarProps {
  className?: string;
  variant?: 'navbar' | 'hero';
}

export default function SearchBar({ className = '', variant = 'navbar' }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query state with URL params
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    
    // Save to recent searches (con manejo de error de quota)
    try {
      const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    } catch (e) {
      // Si hay error de quota, limpiar localStorage y reintentar
      try {
        localStorage.clear();
        localStorage.setItem('recentSearches', JSON.stringify([term]));
        setRecentSearches([term]);
      } catch {
        // Si sigue fallando, ignorar silenciosamente
      }
    }

    setIsFocused(false);
    
    // When searching, only use the search query - don't preserve category filters
    // User is searching for something specific, so search across all categories
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  // Handler para selección de sugerencia (término o subcategoría)
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    // Save to recent searches
    const displayTerm = suggestion.type === 'subcategory' && suggestion.subcategory 
      ? suggestion.subcategory 
      : suggestion.term;
    
    try {
      const newRecent = [displayTerm, ...recentSearches.filter(s => s !== displayTerm)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    } catch (e) {
      try {
        localStorage.clear();
        localStorage.setItem('recentSearches', JSON.stringify([displayTerm]));
        setRecentSearches([displayTerm]);
      } catch {
        // Ignorar silenciosamente
      }
    }

    setIsFocused(false);
    
    if (suggestion.type === 'subcategory' && suggestion.subcategory) {
      // Navegar a la categoría + subcategoría
      router.push(`/search?category=${encodeURIComponent(suggestion.categorySlug)}&subcategory=${encodeURIComponent(suggestion.subcategory)}`);
    } else {
      // Búsqueda normal por término
      setQuery(suggestion.term);
      router.push(`/search?q=${encodeURIComponent(suggestion.term)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const clearSearch = () => {
    setQuery('');
    // Optionally focus back?
  };

  const isHero = variant === 'hero';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div 
        className={`relative flex items-center transition-all duration-200 ${
         isFocused ? 'ring-2 ring-[#13C1AC]' : ''
      } ${
         isHero 
         ? 'bg-white rounded-full shadow-lg h-11 sm:h-14' 
         : 'bg-gray-100 rounded-full h-10 border border-transparent hover:border-gray-300 focus-within:border-[#13C1AC] focus-within:bg-white'
      }`}>
        
        <div className={`flex items-center justify-center ${isHero ? 'pl-3 sm:pl-5' : 'pl-3'}`}>
           <Search className={`${isHero ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-4 w-4'} text-gray-400`} />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={isHero ? "Caută..." : "Caută..."}
          className={`flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 w-full ${
            isHero ? 'px-2 sm:px-4 text-sm sm:text-lg' : 'px-3 text-sm'
          }`}
        />

        {query && (
          <button 
            onClick={clearSearch}
            className={`mr-2 sm:mr-3 p-1 rounded-full hover:bg-gray-200 text-gray-400 ${isHero ? 'sm:mr-4' : ''}`}
          >
            <X className={`${isHero ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-3 w-3'}`} />
          </button>
        )}

        {isHero && (
            <button 
                onClick={() => handleSearch(query)}
                className="mr-1 sm:mr-1.5 bg-[#13C1AC] text-white rounded-full px-4 sm:px-6 py-1.5 sm:py-2.5 text-sm sm:text-base font-medium hover:bg-[#0ea895] transition-colors"
            >
                Caută
            </button>
        )}
      </div>

      {/* dropdown suggestions */}
      {isFocused && (recentSearches.length > 0 || query.length > 0) && (
        <div className={`absolute top-full left-0 right-0 mt-1.5 sm:mt-2 bg-white rounded-lg sm:rounded-xl shadow-xl border border-gray-100 overflow-hidden ${isHero ? 'z-[9999]' : 'z-[99999]'}`}>
           
           {/* Recent Searches Header */}
           {!query && recentSearches.length > 0 && (
             <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 flex items-center justify-between">
               <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Recente</span>
               <button 
                 onClick={() => {
                   setRecentSearches([]);
                   localStorage.removeItem('recentSearches');
                 }}
                 className="text-[10px] sm:text-xs text-gray-400 hover:text-red-500 transition-colors"
               >
                 Șterge tot
               </button>
             </div>
           )}

           {/* Recent list */}
           {!query && recentSearches.map((term, index) => (
             <button
               key={index}
               onClick={() => { setQuery(term); handleSearch(term); }}
               className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 flex items-center group transition-colors"
             >
               <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mr-2.5 sm:mr-3 group-hover:text-[#13C1AC]" />
               <span className="text-sm sm:text-base text-gray-700 font-medium group-hover:text-gray-900">{term}</span>
             </button>
           ))}

           {/* Generic Suggestions (if typing) */}
           {query && (
             <>
                {/* Header */}
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50">
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Căutări sugerate</span>
                </div>

                {/* Filtered suggestions based on query - términos y subcategorías */}
                {allSuggestions
                  .filter(s => {
                    const searchLower = query.toLowerCase();
                    // Match solo si el término/subcategoría EMPIEZA con la búsqueda
                    // "electronice" no debe hacer match con "Electrocasnice"
                    return s.term.toLowerCase().startsWith(searchLower) || 
                           (s.subcategory && s.subcategory.toLowerCase().startsWith(searchLower));
                  })
                  .slice(0, 8)
                  .map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 flex items-start gap-2.5 sm:gap-3 group transition-colors border-b border-gray-50 last:border-b-0"
                    >
                      {suggestion.type === 'subcategory' ? (
                        <Layers className="h-4 w-4 text-[#13C1AC] mt-0.5 flex-shrink-0" />
                      ) : (
                        <Search className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0 group-hover:text-[#13C1AC]" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm sm:text-base text-gray-900">
                          {suggestion.type === 'subcategory' && suggestion.subcategory ? (
                            // Para subcategorías, mostrar el nombre de la subcategoría
                            <span className="font-medium">{suggestion.subcategory}</span>
                          ) : (
                            // Para términos de búsqueda, resaltar la parte coincidente
                            <>
                              <span className="font-bold">{suggestion.term.substring(0, query.length)}</span>
                              <span className="font-normal">{suggestion.term.substring(query.length)}</span>
                            </>
                          )}
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5">
                          {suggestion.type === 'subcategory' ? (
                            // Mostrar ruta de categoría para subcategorías
                            <span className="text-[#13C1AC]">în {suggestion.category}</span>
                          ) : (
                            // Mostrar categoría / subcategoría para términos
                            `${suggestion.category} / ${suggestion.subcategory}`
                          )}
                        </span>
                      </div>
                    </button>
                  ))
                }
                
                {/* If no suggestions match, show search option */}
                {allSuggestions.filter(s => {
                  const searchLower = query.toLowerCase();
                  return s.term.toLowerCase().startsWith(searchLower) || 
                         (s.subcategory && s.subcategory.toLowerCase().startsWith(searchLower));
                }).length === 0 && (
                  <button 
                    onClick={() => handleSearch(query)}
                    className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 flex items-center text-[#13C1AC] font-medium"
                  >
                    <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2.5 sm:mr-3" />
                    <span className="text-sm sm:text-base">Caută &quot;{query}&quot;</span>
                  </button>
                )}
             </>
           )}
        </div>
      )}
    </div>
  );
}
