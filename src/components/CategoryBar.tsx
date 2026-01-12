import { Home, Car, Briefcase, Heart, Wrench, Smartphone, Shirt, PawPrint, Armchair, Dumbbell, Baby, Plane, Gamepad2 } from 'lucide-react';
import Link from 'next/link';

const categories = [
  { name: 'Imobiliare', icon: Home, slug: 'imobiliare' },
  { name: 'Auto & Moto', icon: Car, slug: 'auto-moto' },
  { name: 'Locuri de muncă', icon: Briefcase, slug: 'locuri-de-munca' },
  { name: 'Matrimoniale', icon: Heart, slug: 'matrimoniale' },
  { name: 'Servicii', icon: Wrench, slug: 'servicii' },
  { name: 'Electronice', icon: Smartphone, slug: 'electronice' },
  { name: 'Modă', icon: Shirt, slug: 'moda' },
  { name: 'Animale', icon: PawPrint, slug: 'animale' },
  { name: 'Casă & Grădină', icon: Armchair, slug: 'casa-gradina' },
  { name: 'Sport', icon: Dumbbell, slug: 'sport' },
  { name: 'Copii', icon: Baby, slug: 'copii' },
  { name: 'Turism', icon: Plane, slug: 'turism' },
  { name: 'Gaming', icon: Gamepad2, slug: 'gaming' },
];

export default function CategoryBar() {
  return (
    <div className="bg-white border-b border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide justify-start md:justify-between">
            {categories.map((category) => (
                <Link 
                  href={`/search?category=${category.slug}`}
                  key={category.name} 
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer group w-20"
                >
                    <div className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center mb-2 group-hover:border-[#13C1AC] group-hover:text-[#13C1AC] transition-all text-gray-500 shadow-sm">
                        <category.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-[#13C1AC]">{category.name}</span>
                </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
