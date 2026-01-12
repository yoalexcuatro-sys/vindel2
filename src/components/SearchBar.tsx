
'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

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
    
    // Save to recent searches
    const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));

    setIsFocused(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
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
    <div ref={containerRef} className={`relative w-full ${className}`} style={{ zIndex: 100 }}>
      <div className={`relative flex items-center transition-all duration-200 ${
         isFocused ? 'ring-2 ring-[#13C1AC]' : ''
      } ${
         isHero 
         ? 'bg-white rounded-full shadow-lg h-14' 
         : 'bg-gray-100 rounded-full h-10 border border-transparent hover:border-gray-300 focus-within:border-[#13C1AC] focus-within:bg-white'
      }`}>
        
        <div className={`flex items-center justify-center ${isHero ? 'pl-5' : 'pl-3'}`}>
           <Search className={`${isHero ? 'h-6 w-6' : 'h-4 w-4'} text-gray-400`} />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={isHero ? "Caută în toate categoriile..." : "Caută..."}
          className={`flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 w-full ${
            isHero ? 'px-4 text-lg' : 'px-3 text-sm'
          }`}
        />

        {query && (
          <button 
            onClick={clearSearch}
            className={`mr-3 p-1 rounded-full hover:bg-gray-200 text-gray-400 ${isHero ? 'mr-4' : ''}`}
          >
            <X className={`${isHero ? 'h-5 w-5' : 'h-3 w-3'}`} />
          </button>
        )}

        {isHero && (
            <button 
                onClick={() => handleSearch(query)}
                className="mr-1.5 bg-[#13C1AC] text-white rounded-full px-6 py-2.5 font-medium hover:bg-[#0ea895] transition-colors"
            >
                Caută
            </button>
        )}
      </div>

      {/* dropdown suggestions */}
      {isFocused && (recentSearches.length > 0 || query.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[9999]">
           
           {/* Recent Searches Header */}
           {!query && recentSearches.length > 0 && (
             <div className="px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
               Recente
             </div>
           )}

           {/* Recent list */}
           {!query && recentSearches.map((term, index) => (
             <button
               key={index}
               onClick={() => { setQuery(term); handleSearch(term); }}
               className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center group transition-colors"
             >
               <Clock className="h-4 w-4 text-gray-400 mr-3 group-hover:text-[#13C1AC]" />
               <span className="text-gray-700 font-medium group-hover:text-gray-900">{term}</span>
             </button>
           ))}

           {/* Generic Suggestions (if typing) - Mocked for demo */}
           {query && (
             <>
                <button 
                    onClick={() => handleSearch(query)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center text-[#13C1AC] font-medium"
                >
                    <Search className="h-4 w-4 mr-3" />
                    Caută "{query}"
                </button>
                {/* Mock suggestions logic could go here */}
                {['iphone', 'bicicleta', 'sofa'].filter(t => t.includes(query.toLowerCase()) && t !== query.toLowerCase()).map(term => (
                     <button
                        key={term}
                        onClick={() => { setQuery(term); handleSearch(term); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center group"
                    >
                        <TrendingUp className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-gray-700">{term}</span>
                    </button>
                ))}
             </>
           )}
        </div>
      )}
    </div>
  );
}
