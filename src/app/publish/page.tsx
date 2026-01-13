'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, MapPin, X, ChevronLeft, Check, AlertCircle, Loader2,
  Home, Car, Briefcase, Heart, Wrench, Smartphone, Shirt, PawPrint, 
  Armchair, Dumbbell, Baby, Plane, Gamepad2, Plus, Phone, TreeDeciduous,
  CheckCircle2, Send, Trash2, Star, TrendingUp, Users, Type, DollarSign, Navigation,
  Building2, Store, Building, Warehouse, Key, BedDouble, ChevronDown,
  Bike, Disc, Truck, Ship, Anchor, Clock, Laptop, GraduationCap, Globe, Search, 
  Monitor, Tablet, Tv, Speaker, Plug, Cpu, Footprints, ShoppingBag, Gem, Watch, 
  Glasses, Tent, Fish, Music, Book, Hammer, Droplets, Ticket, Map, Bed, Tractor,
  FileText, Shield, Leaf, ShoppingCart, Scissors, UtensilsCrossed, Utensils, 
  Megaphone, Calculator, Package, Stethoscope, UserCircle, Sparkles
} from 'lucide-react';
import { localidades } from '@/data/localidades';
import { useAuth } from '@/lib/auth-context';
import { createProduct } from '@/lib/products-service';
import { uploadProductImages } from '@/lib/storage-service';

// =============================================================================
// CONSTANTES
// =============================================================================

// Modelos de teléfonos por marca
const PHONE_MODELS: Record<string, string[]> = {
  'Apple': [
    // Serie 17 (sept 2025)
    'iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17 Plus', 'iPhone 17', 'iPhone 17 Air',
    // Serie 16 (sept 2024)
    'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
    // Serie 15
    'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
    // Serie 14
    'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
    // Serie 13
    'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini',
    // Serie 12
    'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 Mini',
    // Serie 11
    'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
    // Serie X
    'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
    // SE
    'iPhone SE (2025)', 'iPhone SE (2022)', 'iPhone SE (2020)',
    'Alt model'
  ],
  'Samsung': [
    // Serie S26 (2026)
    'Galaxy S26 Ultra', 'Galaxy S26+', 'Galaxy S26',
    // Serie S25 (2025)
    'Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25', 'Galaxy S25 FE',
    // Serie S24
    'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S24 FE',
    // Serie S23
    'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
    // Serie S22
    'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
    // Fold
    'Galaxy Z Fold 7', 'Galaxy Z Fold 6', 'Galaxy Z Fold 5', 'Galaxy Z Fold 4',
    // Flip
    'Galaxy Z Flip 7', 'Galaxy Z Flip 6', 'Galaxy Z Flip 5', 'Galaxy Z Flip 4',
    // Serie A
    'Galaxy A56', 'Galaxy A55', 'Galaxy A54', 'Galaxy A36', 'Galaxy A35', 'Galaxy A34',
    'Galaxy A26', 'Galaxy A25', 'Galaxy A16', 'Galaxy A15', 'Galaxy A06',
    // Serie M
    'Galaxy M56', 'Galaxy M55', 'Galaxy M35', 'Galaxy M15',
    'Alt model'
  ],
  'Xiaomi': [
    // Serie 15 (2025)
    'Xiaomi 15 Ultra', 'Xiaomi 15 Pro', 'Xiaomi 15',
    // Serie 14
    'Xiaomi 14 Ultra', 'Xiaomi 14 Pro', 'Xiaomi 14', 'Xiaomi 14 Civi',
    // Serie 13
    'Xiaomi 13 Ultra', 'Xiaomi 13 Pro', 'Xiaomi 13', 'Xiaomi 13 Lite',
    // Redmi Note
    'Redmi Note 15 Pro+', 'Redmi Note 15 Pro', 'Redmi Note 15',
    'Redmi Note 14 Pro+', 'Redmi Note 14 Pro', 'Redmi Note 14',
    'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
    // Redmi
    'Redmi 15C', 'Redmi 14C', 'Redmi 14', 'Redmi 13C', 'Redmi 13',
    // POCO
    'POCO X7 Pro', 'POCO X7', 'POCO X6 Pro', 'POCO X6',
    'POCO F7 Ultra', 'POCO F7 Pro', 'POCO F7', 'POCO F6 Pro', 'POCO F6',
    'POCO M7 Pro', 'POCO M7', 'POCO M6 Pro', 'POCO M6',
    // Mix
    'Xiaomi Mix Fold 4', 'Xiaomi Mix Flip',
    'Alt model'
  ],
  'Huawei': [
    // Pura (2025)
    'Pura 80 Ultra', 'Pura 80 Pro', 'Pura 80',
    // Pura 70
    'Pura 70 Ultra', 'Pura 70 Pro+', 'Pura 70 Pro', 'Pura 70',
    // Mate 70
    'Mate 70 Pro+', 'Mate 70 Pro', 'Mate 70', 'Mate 70 RS',
    // Mate 60
    'Mate 60 Pro+', 'Mate 60 Pro', 'Mate 60', 'Mate 60 RS',
    // Mate X
    'Mate X6', 'Mate X5', 'Mate X3',
    // Nova
    'Nova 13 Ultra', 'Nova 13 Pro', 'Nova 13',
    'Nova 12 Ultra', 'Nova 12 Pro', 'Nova 12',
    'Alt model'
  ],
  'OnePlus': [
    // Serie 14 (2026)
    'OnePlus 14', 'OnePlus 14R',
    // Serie 13
    'OnePlus 13', 'OnePlus 13R',
    // Serie 12
    'OnePlus 12', 'OnePlus 12R',
    // Open
    'OnePlus Open 2', 'OnePlus Open',
    // Nord
    'OnePlus Nord 5', 'OnePlus Nord CE 5',
    'OnePlus Nord 4', 'OnePlus Nord CE 4', 'OnePlus Nord CE 4 Lite',
    'OnePlus Nord 3', 'OnePlus Nord CE 3',
    'Alt model'
  ],
  'Google': [
    // Pixel 10 (2025)
    'Pixel 10 Pro XL', 'Pixel 10 Pro', 'Pixel 10', 'Pixel 10a',
    // Pixel 9
    'Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9', 'Pixel 9a', 'Pixel 9 Pro Fold',
    // Pixel 8
    'Pixel 8 Pro', 'Pixel 8', 'Pixel 8a',
    // Pixel 7
    'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a',
    // Fold
    'Pixel Fold 2', 'Pixel Fold',
    'Alt model'
  ],
  'Oppo': [
    // Find X8
    'Find X8 Ultra', 'Find X8 Pro', 'Find X8',
    // Find X7
    'Find X7 Ultra', 'Find X7',
    // Find N
    'Find N5', 'Find N5 Flip', 'Find N4', 'Find N4 Flip', 'Find N3', 'Find N3 Flip',
    // Reno
    'Reno 13 Pro+', 'Reno 13 Pro', 'Reno 13',
    'Reno 12 Pro', 'Reno 12', 'Reno 11 Pro', 'Reno 11',
    // Serie A
    'A4 Pro', 'A4', 'A3 Pro', 'A3', 'A2',
    'Alt model'
  ],
  'Motorola': [
    // Edge 2025
    'Edge 60 Ultra', 'Edge 60 Pro', 'Edge 60 Fusion',
    // Edge 50
    'Edge 50 Ultra', 'Edge 50 Pro', 'Edge 50 Fusion', 'Edge 50 Neo',
    // Razr 2025
    'Razr 60 Ultra', 'Razr 60',
    // Razr 50
    'Razr 50 Ultra', 'Razr 50', 'Razr 40 Ultra', 'Razr 40',
    // Moto G
    'Moto G86', 'Moto G85', 'Moto G75', 'Moto G55', 'Moto G35',
    'Moto G Power (2025)', 'Moto G Stylus (2025)',
    'ThinkPhone 2', 'ThinkPhone',
    'Alt model'
  ],
  'Nothing': [
    // Phone 3 (2025)
    'Phone (3)', 'Phone (3a)',
    // Phone 2
    'Phone (2a) Plus', 'Phone (2a)', 'Phone (2)',
    // Phone 1
    'Phone (1)',
    // CMF
    'CMF Phone 2', 'CMF Phone 1',
    'Alt model'
  ],
  'Sony': [
    // 2025
    'Xperia 1 VII', 'Xperia 5 VII', 'Xperia 10 VII',
    // 2024
    'Xperia 1 VI', 'Xperia 5 VI', 'Xperia 10 VI',
    // 2023
    'Xperia 1 V', 'Xperia 5 V', 'Xperia 10 V',
    'Xperia Pro-I',
    'Alt model'
  ],
  'Realme': [
    // GT 7 (2025)
    'GT 7 Pro', 'GT 7',
    // GT 6
    'GT 6', 'GT 6T',
    // GT Neo
    'GT Neo 7', 'GT Neo 6 SE', 'GT Neo 6',
    // Serie 14
    '14 Pro+', '14 Pro', '14', '14x',
    // Serie 13
    '13 Pro+', '13 Pro', '13', '13x',
    // Serie C
    'C75', 'C67', 'C55', 'C53',
    // Narzo
    'Narzo 80 Pro', 'Narzo 80', 'Narzo 70 Pro', 'Narzo 70',
    'Alt model'
  ],
  'Honor': [
    // Magic 7 (2025)
    'Magic 7 Pro', 'Magic 7', 'Magic 7 Lite',
    // Magic V4
    'Magic V4', 'Magic V4 Flip',
    // Magic 6
    'Magic 6 Pro', 'Magic 6', 'Magic V3',
    // Serie 300
    '300 Pro', '300', '300 Lite',
    // Serie 200
    '200 Pro', '200', '200 Lite',
    // Serie X
    'X9c', 'X9b', 'X8b',
    'Alt model'
  ],
  'Asus': [
    // ROG Phone 9 (2025)
    'ROG Phone 9 Pro', 'ROG Phone 9',
    // ROG Phone 8
    'ROG Phone 8 Pro', 'ROG Phone 8',
    // ROG Phone 7
    'ROG Phone 7 Ultimate', 'ROG Phone 7',
    // Zenfone
    'Zenfone 12 Ultra', 'Zenfone 11 Ultra', 'Zenfone 10',
    'Alt model'
  ],
  'Nokia': [
    'X40', 'X30', 'X20',
    'G65', 'G60', 'G50', 'G42', 'G22',
    'C35', 'C32', 'C22', 'C12',
    'Alt model'
  ],
  'Altă marcă': ['Alt model']
};

const CATEGORIES = [
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

const CITIES = localidades.map(loc => `${loc.ciudad}, ${loc.judet}`);

// Subcategorías por categoría con iconos
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
    { name: 'Agent securitate', icon: Shield },
    { name: 'Agricultura - Silvicultura - Zootehnie', icon: Leaf },
    { name: 'Casieri si lucratori comerciali', icon: ShoppingCart },
    { name: 'Cereri locuri de munca', icon: Search },
    { name: 'Confectii croitorie', icon: Scissors },
    { name: 'Constructii - Arhitectura - Design', icon: Hammer },
    { name: 'Divertisment evenimente', icon: Star },
    { name: 'Finante contabilitate', icon: Calculator },
    { name: 'Frizerie - Coafura - Cosmetica', icon: Scissors },
    { name: 'Horeca', icon: UtensilsCrossed },
    { name: 'Hostess - Promoteri', icon: UserCircle },
    { name: 'Industrie alimentara', icon: Utensils },
    { name: 'IT - Telecomunicatii', icon: Laptop },
    { name: 'Marketing Publicitate', icon: Megaphone },
    { name: 'Medicina umana', icon: Stethoscope },
    { name: 'Medicina veterinara', icon: PawPrint },
    { name: 'Menaj si ingrijire persoane', icon: Heart },
    { name: 'Multi-level Marketing', icon: TrendingUp },
    { name: 'Muncitori productie - depozit - logistica', icon: Package },
    { name: 'Profesori - Traineri', icon: GraduationCap },
    { name: 'Saloane masaj - Videochat - Adult', icon: Sparkles },
    { name: 'Salubrizare - Curatenie - Dezinsectie', icon: Sparkles },
    { name: 'Service si spalatorie auto', icon: Car },
    { name: 'Soferi - Transporturi', icon: Truck },
    { name: 'Traduceri', icon: Globe }
  ],
  'matrimoniale': [
    { name: 'Femei', icon: Heart },
    { name: 'Bărbați', icon: Heart },
    { name: 'Prietenii', icon: Users },
    { name: 'Întâlniri', icon: Heart },
    { name: 'Relații serioase', icon: Heart }
  ],
  'servicii': [
    { name: 'Construcții', icon: Hammer },
    { name: 'Reparații', icon: Wrench },
    { name: 'Transport', icon: Truck },
    { name: 'Curățenie', icon: Home },
    { name: 'Instalații', icon: Droplets },
    { name: 'IT / Web', icon: Laptop },
    { name: 'Evenimente', icon: Star },
    { name: 'Educație / Meditații', icon: GraduationCap },
    { name: 'Sănătate / Frumusețe', icon: Heart },
    { name: 'Juridice / Contabilitate', icon: Briefcase }
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
    { name: 'Ochelari', icon: Glasses },
    { name: 'Accesorii', icon: Shirt }
  ],
  'animale': [
    { name: 'Câini', icon: PawPrint },
    { name: 'Pisici', icon: PawPrint },
    { name: 'Păsări', icon: PawPrint },
    { name: 'Pești', icon: Fish },
    { name: 'Rozătoare', icon: PawPrint },
    { name: 'Accesorii animale', icon: PawPrint },
    { name: 'Servicii animale', icon: PawPrint },
    { name: 'Animale de fermă', icon: PawPrint }
  ],
  'casa-gradina': [
    { name: 'Mobilier', icon: Armchair },
    { name: 'Decorațiuni', icon: Home },
    { name: 'Electrocasnice', icon: Plug },
    { name: 'Grădinărit', icon: TreeDeciduous },
    { name: 'Unelte', icon: Hammer },
    { name: 'Materiale construcții', icon: Building2 },
    { name: 'Instalații sanitare', icon: Droplets }
  ],
  'sport': [
    { name: 'Fitness', icon: Dumbbell },
    { name: 'Ciclism', icon: Bike },
    { name: 'Sporturi de echipă', icon: Users },
    { name: 'Sporturi de iarnă', icon: Map },
    { name: 'Camping', icon: Tent },
    { name: 'Pescuit / Vânătoare', icon: Fish },
    { name: 'Hobby', icon: Star },
    { name: 'Cărți / Muzică', icon: Music }
  ],
  'copii': [
    { name: 'Îmbrăcăminte copii', icon: Shirt },
    { name: 'Încălțăminte copii', icon: Footprints },
    { name: 'Jucării', icon: Gamepad2 },
    { name: 'Cărucioare', icon: Baby },
    { name: 'Mobilier copii', icon: Bed },
    { name: 'Articole pentru bebeluși', icon: Baby }
  ],
  'turism': [
    { name: 'Hoteluri', icon: Bed },
    { name: 'Pensiuni', icon: Home },
    { name: 'Apartamente turistice', icon: Building2 },
    { name: 'Vile', icon: Home },
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
    { name: 'Accesorii gaming', icon: Gamepad2 },
    { name: 'Retro gaming', icon: Gamepad2 }
  ],
};

// Tipos de campos para formularios dinámicos
type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'tire-size';

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  suffix?: string;
  required?: boolean;
  showWhen?: { field: string; value: string | string[] };
  hideWhen?: { field: string; value: string | string[] };
  advanced?: boolean;
}

// Campos específicos por subcategoría
const SUBCATEGORY_FIELDS: Record<string, FormField[]> = {
  // IMOBILIARE
  'Apartamente': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Vând', 'Închiriez'], required: true },
    { id: 'perioadaInchiriere', label: 'Perioadă închiriere', type: 'select', options: ['Pe lună', 'Pe semestru', 'Pe an'], showWhen: { field: 'tipOferta', value: 'Închiriez' } },
    { id: 'camere', label: 'Număr camere', type: 'select', options: ['1', '2', '3', '4', '5+'], required: true },
    { id: 'suprafata', label: 'Suprafață', type: 'number', placeholder: '0', suffix: 'm²', required: true },
    { id: 'bai', label: 'Băi', type: 'select', options: ['1', '2', '3+'] },
    { id: 'etaj', label: 'Etaj', type: 'select', options: ['Parter', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+', 'Mansardă'] },
    { id: 'anConstructie', label: 'An construcție', type: 'number', placeholder: '2020' },
    { id: 'compartimentare', label: 'Compartimentare', type: 'select', options: ['Decomandat', 'Semidecomandat', 'Nedecomandat', 'Circular'] },
    { id: 'mobilat', label: 'Mobilat', type: 'select', options: ['Mobilat', 'Semimobilat', 'Nemobilat'] },
  ],
  'Case / Vile': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Vând', 'Închiriez'], required: true },
    { id: 'perioadaInchiriere', label: 'Perioadă închiriere', type: 'select', options: ['Pe lună', 'Pe semestru', 'Pe an'], showWhen: { field: 'tipOferta', value: 'Închiriez' } },
    { id: 'camere', label: 'Număr camere', type: 'select', options: ['2', '3', '4', '5', '6', '7+'], required: true },
    { id: 'suprafataUtila', label: 'Suprafață utilă', type: 'number', placeholder: '0', suffix: 'm²', required: true },
    { id: 'suprafataTeren', label: 'Suprafață teren', type: 'number', placeholder: '0', suffix: 'm²' },
    { id: 'bai', label: 'Băi', type: 'select', options: ['1', '2', '3', '4+'] },
    { id: 'anConstructie', label: 'An construcție', type: 'number', placeholder: '2020' },
    { id: 'niveluri', label: 'Niveluri', type: 'select', options: ['1', '2', '3', '4+'] },
    { id: 'garaj', label: 'Garaj', type: 'select', options: ['Da', 'Nu'] },
  ],
  'Terenuri': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Vând', 'Închiriez'], required: true },
    { id: 'perioadaInchiriere', label: 'Perioadă închiriere', type: 'select', options: ['Pe lună', 'Pe semestru', 'Pe an'], showWhen: { field: 'tipOferta', value: 'Închiriez' } },
    { id: 'suprafata', label: 'Suprafață', type: 'number', placeholder: '0', suffix: 'm²', required: true },
    { id: 'tipTeren', label: 'Tip teren', type: 'select', options: ['Intravilan', 'Extravilan', 'Agricol', 'Industrial'] },
    { id: 'frontstradal', label: 'Front stradal', type: 'number', placeholder: '0', suffix: 'm' },
    { id: 'utilitati', label: 'Utilități', type: 'multiselect', options: ['Apă', 'Curent', 'Gaz', 'Canalizare'] },
  ],
  'Spații comerciale': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Vând', 'Închiriez'], required: true },
    { id: 'perioadaInchiriere', label: 'Perioadă închiriere', type: 'select', options: ['Pe lună', 'Pe semestru', 'Pe an'], showWhen: { field: 'tipOferta', value: 'Închiriez' } },
    { id: 'suprafata', label: 'Suprafață', type: 'number', placeholder: '0', suffix: 'm²', required: true },
    { id: 'tipSpatiu', label: 'Tip spațiu', type: 'select', options: ['Comercial', 'Industrial', 'Depozit', 'Producție'] },
    { id: 'vitrina', label: 'Vitrină', type: 'select', options: ['Da', 'Nu'] },
  ],
  'Birouri': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Vând', 'Închiriez'], required: true },
    { id: 'perioadaInchiriere', label: 'Perioadă închiriere', type: 'select', options: ['Pe lună', 'Pe semestru', 'Pe an'], showWhen: { field: 'tipOferta', value: 'Închiriez' } },
    { id: 'suprafata', label: 'Suprafață', type: 'number', placeholder: '0', suffix: 'm²', required: true },
    { id: 'etaj', label: 'Etaj', type: 'select', options: ['Parter', '1', '2', '3', '4', '5+'] },
    { id: 'clasa', label: 'Clasă clădire', type: 'select', options: ['A', 'B', 'C'] },
  ],
  'Garaje / Parcări': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Vând', 'Închiriez'], required: true },
    { id: 'perioadaInchiriere', label: 'Perioadă închiriere', type: 'select', options: ['Pe lună', 'Pe semestru', 'Pe an'], showWhen: { field: 'tipOferta', value: 'Închiriez' } },
    { id: 'tipGaraj', label: 'Tip', type: 'select', options: ['Garaj', 'Loc parcare', 'Parcare subterană'], required: true },
    { id: 'suprafata', label: 'Suprafață', type: 'number', placeholder: '0', suffix: 'm²' },
  ],
  'Închirieri': [
    { id: 'perioadaInchiriere', label: 'Perioadă închiriere', type: 'select', options: ['Pe lună', 'Pe semestru', 'Pe an'], required: true },
    { id: 'camere', label: 'Număr camere', type: 'select', options: ['1', '2', '3', '4', '5+'], required: true },
    { id: 'suprafata', label: 'Suprafață', type: 'number', placeholder: '0', suffix: 'm²' },
    { id: 'mobilat', label: 'Mobilat', type: 'select', options: ['Mobilat', 'Semimobilat', 'Nemobilat'] },
    { id: 'perioadaMinima', label: 'Perioadă minimă', type: 'select', options: ['1 lună', '3 luni', '6 luni', '12 luni'] },
  ],
  'Camere de închiriat': [
    { id: 'perioadaInchiriere', label: 'Perioadă închiriere', type: 'select', options: ['Pe lună', 'Pe semestru', 'Pe an'], required: true },
    { id: 'tipCamera', label: 'Tip cameră', type: 'select', options: ['Cameră singură', 'Cameră dublă', 'Garsonieră'], required: true },
    { id: 'baieProprie', label: 'Baie proprie', type: 'select', options: ['Da', 'Nu'] },
  ],
  // AUTO & MOTO
  'Autoturisme': [
    { id: 'marca', label: 'Marcă', type: 'select', options: ['Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Bugatti', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Citroën', 'Dacia', 'Daewoo', 'Daihatsu', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 'Genesis', 'GMC', 'Honda', 'Hummer', 'Hyundai', 'Infiniti', 'Isuzu', 'Iveco', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini', 'Lancia', 'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz', 'MG', 'Mini', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Pontiac', 'Porsche', 'Ram', 'Renault', 'Rolls-Royce', 'Rover', 'Saab', 'Seat', 'Skoda', 'Smart', 'SsangYong', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'Altă marcă'], required: true },
    { id: 'model', label: 'Model', type: 'text', placeholder: 'ex: Golf, Seria 3...', required: true },
    { id: 'anFabricatie', label: 'An fabricație', type: 'number', placeholder: '2020', required: true },
    { id: 'km', label: 'Kilometraj', type: 'number', placeholder: '0', suffix: 'km', required: true },
    { id: 'combustibil', label: 'Combustibil', type: 'select', options: ['Benzină', 'Diesel', 'GPL', 'Hibrid', 'Electric'], required: true },
    { id: 'capacitate', label: 'Capacitate cilindrică', type: 'number', placeholder: '1600', suffix: 'cm³' },
    { id: 'putere', label: 'Putere', type: 'number', placeholder: '100', suffix: 'CP' },
    { id: 'cutie', label: 'Cutie de viteze', type: 'select', options: ['Manuală', 'Automată', 'Semi-automată'] },
    { id: 'tractiune', label: 'Tracțiune', type: 'select', options: ['Față', 'Spate', '4x4'] },
    { id: 'caroserie', label: 'Caroserie', type: 'select', options: ['Sedan', 'Hatchback', 'Break', 'SUV', 'Coupe', 'Cabrio', 'Monovolum', 'Pick-up'] },
    { id: 'culoare', label: 'Culoare', type: 'select', options: ['Alb', 'Negru', 'Gri', 'Argintiu', 'Albastru', 'Roșu', 'Verde', 'Maro', 'Bej', 'Altă culoare'] },
    { id: 'nrUsi', label: 'Număr uși', type: 'select', options: ['2', '3', '4', '5'] },
    { id: 'normaEuro', label: 'Normă poluare', type: 'select', options: ['Euro 3', 'Euro 4', 'Euro 5', 'Euro 6', 'Non-Euro'] },
    { id: 'vin', label: 'Serie șasiu (VIN)', type: 'text', placeholder: 'ex: WVWZZZ3CZWE123456' },
    { id: 'inmatriculat', label: 'Înmatriculat RO', type: 'select', options: ['Da', 'Nu'] },
    { id: 'serviceBook', label: 'Carte service', type: 'select', options: ['Da', 'Nu'] },
    { id: 'primaInmatriculare', label: 'Prima înmatriculare', type: 'text', placeholder: 'ex: 03/2020' },
  ],
  'Moto': [
    { id: 'marca', label: 'Marcă', type: 'select', options: ['Aprilia', 'Benelli', 'Beta', 'BMW', 'Buell', 'Can-Am', 'CF Moto', 'Ducati', 'Gas Gas', 'Harley-Davidson', 'Honda', 'Husqvarna', 'Indian', 'Kawasaki', 'KTM', 'Kymco', 'MV Agusta', 'Moto Guzzi', 'Norton', 'Piaggio', 'Polaris', 'Royal Enfield', 'Suzuki', 'SYM', 'Triumph', 'Vespa', 'Victory', 'Yamaha', 'Zero', 'Altă marcă'], required: true },
    { id: 'model', label: 'Model', type: 'text', placeholder: 'Model', required: true },
    { id: 'anFabricatie', label: 'An fabricație', type: 'number', placeholder: '2020', required: true },
    { id: 'km', label: 'Kilometraj', type: 'number', placeholder: '0', suffix: 'km' },
    { id: 'capacitate', label: 'Capacitate cilindrică', type: 'number', placeholder: '600', suffix: 'cm³' },
    { id: 'putere', label: 'Putere', type: 'number', placeholder: '100', suffix: 'CP' },
    { id: 'tipMoto', label: 'Tip', type: 'select', options: ['Sport', 'Naked', 'Chopper', 'Touring', 'Enduro', 'Cross', 'Scuter', 'ATV', 'Trike'] },
    { id: 'culoare', label: 'Culoare', type: 'text', placeholder: 'Culoare' },
    { id: 'vin', label: 'Serie șasiu (VIN)', type: 'text', placeholder: 'Serie șasiu' },
  ],
  'Anvelope': [
    { id: 'tipAnvelopa', label: 'Tip anvelopă', type: 'select', options: ['Vară', 'Iarnă', 'All Season'], required: true },
    { id: 'marcaAnvelopa', label: 'Marcă', type: 'select', options: ['Michelin', 'Continental', 'Bridgestone', 'Pirelli', 'Goodyear', 'Dunlop', 'Hankook', 'Yokohama', 'Nokian', 'Firestone', 'BFGoodrich', 'Falken', 'Toyo', 'Kumho', 'Nexen', 'Cooper', 'General Tire', 'Vredestein', 'Maxxis', 'Nitto', 'Sumitomo', 'Barum', 'Uniroyal', 'Kleber', 'Semperit', 'Sava', 'Debica', 'Matador', 'Apollo', 'Petlas', 'Laufenn', 'GT Radial', 'Roadstone', 'Westlake', 'Nankang', 'Achilles', 'Federal', 'Radar', 'Triangle', 'Linglong', 'Goodride', 'Sunny', 'Hifly', 'Altă marcă'], required: true },
    { id: 'latime', label: 'Lățime', type: 'select', options: ['125', '135', '145', '155', '165', '175', '185', '195', '205', '215', '225', '235', '245', '255', '265', '275', '285', '295', '305', '315', '325', '335', '345', '355'], required: true, suffix: 'mm' },
    { id: 'inaltime', label: 'Înălțime profil', type: 'select', options: ['25', '30', '35', '40', '45', '50', '55', '60', '65', '70', '75', '80', '85'], required: true },
    { id: 'diametru', label: 'Diametru jantă', type: 'select', options: ['13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'], required: true, suffix: 'inch' },
    { id: 'dimensiuneCompleta', label: 'Dimensiune completă', type: 'tire-size', placeholder: '205/55/R16', required: true },
    { id: 'indiceIncarcatura', label: 'Indice de încărcătură', type: 'select', options: ['60', '62', '64', '66', '68', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120', '121'] },
    { id: 'indiceViteza', label: 'Indice viteză', type: 'select', options: ['L (120 km/h)', 'M (130 km/h)', 'N (140 km/h)', 'P (150 km/h)', 'Q (160 km/h)', 'R (170 km/h)', 'S (180 km/h)', 'T (190 km/h)', 'U (200 km/h)', 'H (210 km/h)', 'V (240 km/h)', 'W (270 km/h)', 'Y (300 km/h)', 'ZR (peste 240 km/h)'] },
    { id: 'dotAnvelopa', label: 'DOT (data fabricație)', type: 'text', placeholder: 'ex: 2523 (săpt 25, an 2023)' },
    { id: 'uzura', label: 'Uzură', type: 'select', options: ['Nouă', '90%', '80%', '70%', '60%', '50%', '40%', '30%', 'Sub 30%'], required: true },
    { id: 'bucati', label: 'Bucăți', type: 'select', options: ['1', '2', '3', '4', '5', '6', '8', 'Set complet'], required: true },
    { id: 'runflat', label: 'Run Flat', type: 'select', options: ['Da', 'Nu'] },
    { id: 'ranforsat', label: 'Ranforsat (XL/Extra Load)', type: 'select', options: ['Da', 'Nu'] },
    { id: 'tipVehicul', label: 'Tip vehicul', type: 'select', options: ['Autoturism', 'SUV / 4x4', 'Camionetă', 'Utilitară', 'Camion', 'Moto', 'ATV'] },
  ],
  'Jante / Roți': [
    { id: 'tipJanta', label: 'Tip jantă', type: 'select', options: ['Aliaj / Aluminiu', 'Tablă / Oțel', 'Forjată', 'Carbon', 'Magneziu'], required: true },
    { id: 'marcaJanta', label: 'Marcă jantă', type: 'select', options: ['OEM / Originală', 'BBS', 'OZ Racing', 'Enkei', 'Rays', 'Vossen', 'HRE', 'ADV.1', 'Rotiform', 'Work Wheels', 'SSR', 'Vorsteiner', 'Forgeline', 'TSW', 'Niche', 'Fuel', 'American Racing', 'XD Series', 'Momo', 'Sparco', 'ATS', 'Rial', 'Alutec', 'Dezent', 'Borbet', 'Ronal', 'Dotz', 'Anzio', 'Autec', 'CMS', 'DBV', 'Enzo', 'Fox Racing', 'Inter Action', 'IT Wheels', 'Japan Racing', 'Keskin', 'MAK', 'Magline', 'MAM', 'Monaco', 'MSW', 'Platin', 'ProLine', 'RC Design', 'Speedline', 'Team Dynamics', 'Tomason', 'Wheelworld', 'WSP Italy', 'Altă marcă'], required: true },
    { id: 'diametruJanta', label: 'Diametru', type: 'select', options: ['13"', '14"', '15"', '16"', '17"', '18"', '19"', '20"', '21"', '22"', '23"', '24"', '26"', '28"'], required: true },
    { id: 'latimeJanta', label: 'Lățime (J)', type: 'select', options: ['4.5J', '5J', '5.5J', '6J', '6.5J', '7J', '7.5J', '8J', '8.5J', '9J', '9.5J', '10J', '10.5J', '11J', '11.5J', '12J', '12.5J', '13J'], required: true },
    { id: 'et', label: 'ET (Offset)', type: 'text', placeholder: 'ex: ET35, ET45' },
    { id: 'pcd', label: 'PCD (găuri)', type: 'select', options: ['3x112', '4x98', '4x100', '4x108', '4x114.3', '5x98', '5x100', '5x108', '5x110', '5x112', '5x114.3', '5x115', '5x118', '5x120', '5x127', '5x130', '5x139.7', '5x150', '6x114.3', '6x127', '6x135', '6x139.7', '8x165.1', '8x170', '8x180', 'Multi PCD', 'Altul'], required: true },
    { id: 'diametruCentral', label: 'Diametru central (CB)', type: 'text', placeholder: 'ex: 57.1, 66.6, 72.6' },
    { id: 'culoare', label: 'Culoare', type: 'select', options: ['Argintiu', 'Negru mat', 'Negru lucios', 'Grafit', 'Antracit', 'Gunmetal', 'Gri', 'Alb', 'Crom', 'Auriu', 'Bronze', 'Cupru', 'Roșu', 'Albastru', 'Verde', 'Violet', 'Hiperblack', 'Machine Face', 'Diamond Cut', 'Polisat', 'Altă culoare'] },
    { id: 'stareJanta', label: 'Stare', type: 'select', options: ['Nouă', 'Ca nouă', 'Folosită - bună', 'Folosită - uzată', 'Necesită recondiționare'], required: true },
    { id: 'bucatiJante', label: 'Bucăți', type: 'select', options: ['1', '2', '3', '4', '5', 'Set 4 + roată rezervă'], required: true },
    { id: 'cuAnvelope', label: 'Cu anvelope incluse', type: 'select', options: ['Da', 'Nu'] },
    { id: 'marcaAuto', label: 'Compatibil marcă auto', type: 'select', options: ['Acura', 'Alfa Romeo', 'Audi', 'BMW', 'Chevrolet', 'Citroën', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Porsche', 'Renault', 'Seat', 'Skoda', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'Universal', 'Altă marcă'] },
    { id: 'modelCompatibil', label: 'Modele compatibile', type: 'text', placeholder: 'ex: Golf, Passat, A3, A4' },
  ],
  'Piese și accesorii': [
    { id: 'categoriePiesa', label: 'Categorie piesă', type: 'select', options: ['🔧 Motor și componente', '🚗 Caroserie exterior', '🪑 Interior și confort', '🔩 Suspensie și direcție', '🛑 Sistem de frânare', '⚡ Sistem electric', '⚙️ Transmisie și ambreiaj', '❄️ Sistem răcire și AC', '💨 Sistem evacuare', '🛞 Roți și anvelope', '💡 Faruri și iluminare', '🪟 Geamuri și oglinzi', '🔊 Audio și multimedia', '🛡️ Accesorii și tuning'], required: true },
    { id: 'tipPiesa', label: 'Tip piesă', type: 'select', options: ['Bloc motor', 'Chiulasă', 'Turbosuflantă', 'Injectoare', 'Alternator', 'Electromotor', 'Capotă', 'Aripă față', 'Aripă spate', 'Ușă față', 'Ușă spate', 'Bară față', 'Bară spate', 'Scaun șofer', 'Scaun pasager', 'Volan', 'Bord / Tablou bord', 'Amortizor față', 'Amortizor spate', 'Discuri frână față', 'Discuri frână spate', 'Plăcuțe frână', 'Calculator motor (ECU)', 'Cutie viteze manuală', 'Cutie viteze automată', 'Radiator apă', 'Compresor AC', 'Far stânga', 'Far dreapta', 'Stop stânga', 'Stop dreapta', 'Parbriz', 'Lunetă', 'Oglindă stânga', 'Oglindă dreapta', 'Radio / Navigație', 'Jantă aliaj', 'Jantă tablă', 'Altă piesă'], required: true },
    { id: 'compatibilitate', label: 'Compatibilitate', type: 'text', placeholder: 'ex: VW Golf 5, 2010' },
    { id: 'marcaAuto', label: 'Marcă auto', type: 'select', options: ['Acura', 'Alfa Romeo', 'Audi', 'BMW', 'Chevrolet', 'Citroën', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Porsche', 'Renault', 'Seat', 'Skoda', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'Altă marcă'] },
    { id: 'modelAuto', label: 'Model auto', type: 'text', placeholder: 'ex: Golf, Passat, Focus' },
    { id: 'anFabricatie', label: 'An fabricație (auto)', type: 'text', placeholder: 'ex: 2015-2020' },
    { id: 'codPiesa', label: 'Cod piesă / OEM', type: 'text', placeholder: 'ex: 1K0615301AA' },
    { id: 'garantie', label: 'Garanție', type: 'select', options: ['Fără garanție', '30 zile', '3 luni', '6 luni', '12 luni'] },
    { id: 'producator', label: 'Producător', type: 'text', placeholder: 'ex: Bosch, Valeo, Original' },
  ],
  'Transport': [
    { id: 'tipTransport', label: 'Tip transport', type: 'select', options: ['Marfă', 'Persoane', 'Internațional'], required: true },
    { id: 'capacitate', label: 'Capacitate', type: 'text', placeholder: 'ex: 3.5t, 8 locuri' },
  ],
  'Utilaje': [
    { id: 'tipUtilaj', label: 'Tip utilaj', type: 'select', options: ['Excavator', 'Buldozer', 'Macara', 'Încărcător', 'Tractor', 'Altul'], required: true },
    { id: 'anFabricatie', label: 'An fabricație', type: 'number', placeholder: '2020' },
    { id: 'oreFunc', label: 'Ore funcționare', type: 'number', placeholder: '0', suffix: 'h' },
  ],
  'Camioane': [
    { id: 'marca', label: 'Marcă', type: 'select', options: ['DAF', 'Iveco', 'MAN', 'Mercedes', 'Renault', 'Scania', 'Volvo', 'Altă marcă'], required: true },
    { id: 'anFabricatie', label: 'An fabricație', type: 'number', placeholder: '2020', required: true },
    { id: 'km', label: 'Kilometraj', type: 'number', placeholder: '0', suffix: 'km' },
    { id: 'capacitate', label: 'Capacitate', type: 'number', placeholder: '0', suffix: 't' },
  ],
  'Rulote': [
    { id: 'tipRulota', label: 'Tip', type: 'select', options: ['Rulotă', 'Autorulotă', 'Camper'], required: true },
    { id: 'anFabricatie', label: 'An fabricație', type: 'number', placeholder: '2020' },
    { id: 'locuri', label: 'Număr locuri', type: 'select', options: ['2', '4', '6', '8+'] },
  ],
  'Bărci / Ambarcațiuni': [
    { id: 'tipBarca', label: 'Tip', type: 'select', options: ['Barcă', 'Yacht', 'Jet-ski', 'Șalupă'], required: true },
    { id: 'lungime', label: 'Lungime', type: 'number', placeholder: '0', suffix: 'm' },
    { id: 'motor', label: 'Motorizare', type: 'text', placeholder: 'ex: 150 CP' },
  ],
  // LOCURI DE MUNCA
  // LOCURI DE MUNCA
  'Administratie': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Gestionari', 'Juriști', 'Manageri', 'Operatori calculator', 'Resurse umane', 'Secretariat', 'Altele'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Remote', 'Hybrid', 'Colaborare', 'Internship', 'Sezonier', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'nivelExperienta', label: 'Experiență', type: 'select', options: ['Fără experiență', 'Entry-level', 'Junior', 'Mid-level', 'Senior'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 3000-4000 LEI' },
  ],
  'Agenti - consultanti vanzari': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Agent vânzări', 'Telesales', 'Altele'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Remote', 'Hybrid', 'Colaborare', 'Comision', 'Internship', 'Sezonier', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'nivelExperienta', label: 'Experiență', type: 'select', options: ['Fără experiență', 'Entry-level', 'Junior', 'Mid-level', 'Senior'] },
    { id: 'salariu', label: 'Salariu/Comision', type: 'text', placeholder: 'ex: 3000 LEI + comision' },
  ],
  'Agent securitate': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Agent pază', 'Bodyguard', 'Dispecer', 'Șef tură', 'Supraveghetor', 'Agent intervenție', 'Altele'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Ture', 'Colaborare', 'Sezonier', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'atestat', label: 'Atestat pază', type: 'select', options: ['Necesar', 'Nu este necesar', 'Am atestat'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 3000 LEI' },
  ],
  'Agricultura - Silvicultura - Zootehnie': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Sezonier', 'Zilier', 'Colaborare', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'nivelExperienta', label: 'Experiență', type: 'select', options: ['Fără experiență', 'Cu experiență'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 2500 LEI' },
  ],
  'Casieri si lucratori comerciali': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Ture', 'Sezonier', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'nivelExperienta', label: 'Experiență', type: 'select', options: ['Fără experiență', 'Cu experiență'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 2800 LEI' },
  ],
  'Cereri locuri de munca': [
    { id: 'domeniu', label: 'Domeniu căutat', type: 'text', placeholder: 'ex: IT, Vânzări, Construcții', required: true },
    { id: 'tipContract', label: 'Tip contract dorit', type: 'select', options: ['Full-time', 'Part-time', 'Remote', 'Hybrid', 'Colaborare', 'Internship', 'Sezonier', 'Orice'] },
    { id: 'nivelExperienta', label: 'Experiența mea', type: 'select', options: ['Fără experiență', 'Entry-level', 'Junior', 'Mid-level', 'Senior'] },
    { id: 'salariuDorit', label: 'Salariu dorit', type: 'text', placeholder: 'ex: minim 3000 LEI' },
  ],
  'Confectii croitorie': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Acord', 'Colaborare', 'Sezonier', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'nivelExperienta', label: 'Experiență', type: 'select', options: ['Fără experiență', 'Cu experiență', 'Calificat'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 2500 LEI' },
  ],
  'Constructii - Arhitectura - Design': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Arhitecți', 'Designeri interioare', 'Electricieni', 'Finisaje', 'Grădinari – Peisagiști', 'Ingineri', 'Instalatori', 'Muncitori construcții', 'Operatori utilaje', 'Sudori', 'Tâmplari și montatori mobilier', 'Zidari', 'Zugravi', 'Altele'], required: true },
    { id: 'nivelExperienta', label: 'Experiență', type: 'select', options: ['Fără experiență', 'Cu experiență', 'Meșter'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 4000 LEI' },
  ],
  'Divertisment evenimente': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Colaborare', 'Per eveniment', 'Sezonier', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'salariu', label: 'Salariu/Onorariu', type: 'text', placeholder: 'ex: 200 LEI/eveniment' },
  ],
  'Finante contabilitate': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Remote', 'Hybrid', 'Colaborare', 'Internship', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'nivelExperienta', label: 'Experiență', type: 'select', options: ['Junior', 'Mid-level', 'Senior', 'Expert'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 5000 LEI' },
  ],
  'Frizerie - Coafura - Cosmetica': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'specialitate', label: 'Specialitate', type: 'select', options: ['Frizer', 'Coafor', 'Cosmetician', 'Manichiuristă', 'Maseuză', 'Altul'] },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Angajare', 'Colaborare', 'Închiriere scaun'] },
    { id: 'salariu', label: 'Salariu/Comision', type: 'text', placeholder: 'ex: 50% din servicii' },
  ],
  'Horeca': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Bucătar - ajutor bucătar', 'Ospătar, barman, șef de sală', 'Personal curățenie și cameriști', 'Personal Fast Food', 'Personal recepție și administrație', 'Spălători vase', 'Altele'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Sezonier', 'Ture', 'Colaborare', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 3000 LEI + tips' },
  ],
  'Hostess - Promoteri': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Per eveniment', 'Colaborare', 'Sezonier', 'Temporar'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 100 LEI/zi' },
  ],
  'Industrie alimentara': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Brutărie - Patiserie – Cofetărie', 'Prelucrare carne – abator', 'Altele'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Ture', 'Sezonier', 'Colaborare', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'nivelExperienta', label: 'Experiență', type: 'select', options: ['Fără experiență', 'Cu experiență'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 2800 LEI' },
  ],
  'IT - Telecomunicatii': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Developer', 'DevOps', 'QA', 'Project Manager', 'Support', 'Network Admin', 'Altul'] },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Remote', 'Hybrid', 'Freelance', 'Colaborare', 'Internship', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'nivelExperienta', label: 'Experiență', type: 'select', options: ['Junior', 'Mid-level', 'Senior', 'Lead'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 8000-12000 LEI' },
  ],
  'Marketing Publicitate': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Remote', 'Hybrid', 'Freelance', 'Colaborare', 'Internship', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'nivelExperienta', label: 'Experiență', type: 'select', options: ['Junior', 'Mid-level', 'Senior'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 5000 LEI' },
  ],
  'Medicina umana': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Medic', 'Asistent medical', 'Infirmier', 'Brancardier', 'Altul'] },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Garzi', 'Colaborare', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 6000 LEI' },
  ],
  'Medicina veterinara': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Medic veterinar', 'Asistent veterinar', 'Îngrijitor', 'Altul'] },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Colaborare', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 5000 LEI' },
  ],
  'Menaj si ingrijire persoane': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Bone', 'Îngrijitori bătrâni', 'Menajere', 'Altele'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Cu cazare', 'Colaborare', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 2500 LEI' },
  ],
  'Multi-level Marketing': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer oportunitate', 'Caut oportunitate'], required: true },
    { id: 'companie', label: 'Companie', type: 'text', placeholder: 'Numele companiei' },
    { id: 'castigPotential', label: 'Câștig potențial', type: 'text', placeholder: 'ex: 2000-10000 LEI' },
  ],
  'Muncitori productie - depozit - logistica': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Ambalatori', 'Controlori calitate', 'Gestionari depozit', 'Manipulanți marfă', 'Operatori producție', 'Operatori utilaje', 'Altele'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Ture', 'Sezonier', 'Colaborare', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 3000 LEI' },
  ],
  'Profesori - Traineri': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'domeniu', label: 'Domeniu', type: 'text', placeholder: 'ex: Matematică, Engleză, Fitness' },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Pe ore', 'Remote', 'Hybrid', 'Colaborare', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'salariu', label: 'Salariu/Oră', type: 'text', placeholder: 'ex: 100 LEI/oră' },
  ],
  'Saloane masaj - Videochat - Adult': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'text', placeholder: 'ex: Model, Maseuză' },
    { id: 'tipContract', label: 'Tip colaborare', type: 'select', options: ['Angajare', 'Colaborare', 'Procent'] },
    { id: 'castig', label: 'Câștig', type: 'text', placeholder: 'ex: 50-70% din servicii' },
  ],
  'Salubrizare - Curatenie - Dezinsectie': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Ture', 'Colaborare', 'Sezonier', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'nivelExperienta', label: 'Experiență', type: 'select', options: ['Fără experiență', 'Cu experiență'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 2500 LEI' },
  ],
  'Service si spalatorie auto': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Service auto', 'Spălătorie auto', 'Mecanic', 'Electrician auto', 'Tinichigiu', 'Vopsitor', 'Vulcanizator', 'Spălător', 'Altele'], required: true },
    { id: 'nivelExperienta', label: 'Experiență', type: 'select', options: ['Fără experiență', 'Cu experiență', 'Meșter'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 3500 LEI' },
  ],
  'Soferi - Transporturi': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'pozitie', label: 'Poziție', type: 'select', options: ['Curierat și livrări', 'Dispeceri', 'Taximetrie', 'Transport marfă - intern', 'Transport marfă - internațional', 'Transport persoane', 'Altele'], required: true },
    { id: 'permis', label: 'Categoria permis', type: 'select', options: ['B', 'C', 'CE', 'D', 'DE'] },
    { id: 'salariu', label: 'Salariu', type: 'text', placeholder: 'ex: 5000 LEI' },
  ],
  'Traduceri': [
    { id: 'tipOferta', label: 'Tip ofertă', type: 'select', options: ['Ofer loc de muncă'], required: true },
    { id: 'limbi', label: 'Limbi', type: 'text', placeholder: 'ex: Engleză, Germană', required: true },
    { id: 'tipContract', label: 'Tip contract', type: 'select', options: ['Full-time', 'Part-time', 'Remote', 'Hybrid', 'Freelance', 'Colaborare', 'Temporar', 'Pe perioadă determinată', 'Pe perioadă nedeterminată'] },
    { id: 'salariu', label: 'Tarif', type: 'text', placeholder: 'ex: 50 LEI/pagină' },
  ],
  // ELECTRONICE
  'Telefoane': [
    { id: 'marca', label: 'Marcă', type: 'select', options: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'OnePlus', 'Google', 'Oppo', 'Motorola', 'Nothing', 'Sony', 'Realme', 'Honor', 'Asus', 'Nokia', 'Altă marcă'], required: true },
    { id: 'model', label: 'Model', type: 'select', options: [], required: true },
    { id: 'memorie', label: 'Memorie', type: 'select', options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'] },
    { id: 'culoare', label: 'Culoare', type: 'select', options: ['Negru', 'Alb', 'Argintiu', 'Gri', 'Auriu', 'Roz', 'Albastru', 'Verde', 'Mov', 'Roșu', 'Portocaliu', 'Galben', 'Maro', 'Titan Natural', 'Titan Albastru', 'Titan Negru', 'Titan Alb', 'Altă culoare'] },
  ],
  'Laptopuri': [
    { id: 'marca', label: 'Marcă', type: 'select', options: ['Apple', 'ASUS', 'Dell', 'HP', 'Lenovo', 'Acer', 'MSI', 'Razer', 'Samsung', 'Huawei', 'Microsoft', 'Toshiba', 'LG', 'Gigabyte', 'Medion', 'Fujitsu', 'Alienware', 'Altă marcă'], required: true },
    { id: 'model', label: 'Model', type: 'text', placeholder: 'Model', required: true },
    { id: 'procesor', label: 'Procesor', type: 'text', placeholder: 'ex: Intel i7, M2' },
    { id: 'ram', label: 'RAM', type: 'select', options: ['4GB', '8GB', '16GB', '32GB', '64GB'] },
    { id: 'stocare', label: 'Stocare', type: 'select', options: ['128GB SSD', '256GB SSD', '512GB SSD', '1TB SSD', '1TB HDD', '2TB'] },
    { id: 'diagonala', label: 'Diagonală', type: 'select', options: ['13"', '14"', '15.6"', '16"', '17"'] },
  ],
  'Calculatoare': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['Desktop', 'All-in-One', 'Mini PC', 'Workstation'], required: true },
    { id: 'procesor', label: 'Procesor', type: 'text', placeholder: 'ex: Intel i7, Ryzen 7' },
    { id: 'ram', label: 'RAM', type: 'select', options: ['8GB', '16GB', '32GB', '64GB'] },
    { id: 'placaVideo', label: 'Placă video', type: 'text', placeholder: 'ex: RTX 4070' },
  ],
  'Tablete': [
    { id: 'marca', label: 'Marcă', type: 'select', options: ['Apple', 'Samsung', 'Lenovo', 'Huawei', 'Xiaomi', 'Altă marcă'], required: true },
    { id: 'model', label: 'Model', type: 'text', placeholder: 'Model' },
    { id: 'diagonala', label: 'Diagonală', type: 'select', options: ['8"', '10"', '11"', '12.9"', '13"'] },
  ],
  'TV / Audio': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['Televizor', 'Soundbar', 'Boxe', 'Căști', 'Amplificator', 'Home Cinema'], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'Marcă' },
    { id: 'diagonala', label: 'Diagonală (TV)', type: 'select', options: ['32"', '43"', '50"', '55"', '65"', '75"', '85"'] },
  ],
  'Foto / Video': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['Aparat foto', 'Cameră video', 'Dronă', 'Obiectiv', 'Proiector', 'Trepied', 'Stabilizator/Gimbal', 'Lumini studio', 'Microfon', 'Card memorie', 'Baterii/Încărcătoare', 'Geantă/Rucsac foto', 'Filtru', 'Bliț', 'Accesorii'], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'ex: Canon, Sony, DJI, Nikon, Panasonic' },
    { id: 'rezolutie', label: 'Rezoluție', type: 'select', options: ['HD (720p)', 'Full HD (1080p)', '2K', '4K', '6K', '8K', 'Altă rezoluție'] },
  ],
  'Electrocasnice': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['Frigider', 'Mașină spălat', 'Uscător', 'Cuptor', 'Aragaz', 'Aspirator', 'Aer condiționat', 'Altul'], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'Marcă' },
    { id: 'clasaEnergetica', label: 'Clasă energetică', type: 'select', options: ['A+++', 'A++', 'A+', 'A', 'B', 'C'] },
  ],
  'Componente PC': [
    { id: 'tip', label: 'Tip componentă', type: 'select', options: ['Procesor', 'Placă video', 'Placă de bază', 'RAM', 'SSD/HDD', 'Sursă', 'Carcasă', 'Cooler'], required: true },
    { id: 'model', label: 'Model', type: 'text', placeholder: 'Model' },
  ],
  'Console / Gaming': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['PlayStation', 'Xbox', 'Nintendo', 'Steam Deck', 'Accesorii'], required: true },
    { id: 'model', label: 'Model', type: 'text', placeholder: 'ex: PS5, Xbox Series X' },
  ],
  'Accesorii': [
    { id: 'tipAccesoriu', label: 'Tip accesoriu', type: 'select', options: ['Huse/Carcase', 'Încărcătoare', 'Cabluri', 'Suporturi', 'Altele'], required: true },
    { id: 'compatibilitate', label: 'Compatibilitate', type: 'text', placeholder: 'ex: iPhone 15, Samsung S24' },
  ],
  // SERVICII
  'Construcții': [
    { id: 'tipServiciu', label: 'Tip serviciu', type: 'select', options: ['Construcții case', 'Renovări', 'Amenajări interioare', 'Zugrăveli', 'Gresie/Faianță', 'Parchet/Podele', 'Rigips/Tencuieli', 'Acoperiș', 'Fundații', 'Demolări', 'Altele'], required: true },
    { id: 'experienta', label: 'Experiență', type: 'select', options: ['Sub 1 an', '1-3 ani', '3-5 ani', '5-10 ani', 'Peste 10 ani'] },
    { id: 'zona', label: 'Zonă activitate', type: 'text', placeholder: 'ex: București și Ilfov' },
  ],
  'Reparații': [
    { id: 'tipReparatie', label: 'Tip reparație', type: 'select', options: ['Electrocasnice', 'Electronice', 'Auto', 'Mobilier', 'Calculatoare/Telefoane', 'Încălțăminte', 'Îmbrăcăminte', 'Ceasuri', 'Altele'], required: true },
    { id: 'zona', label: 'Zonă activitate', type: 'text', placeholder: 'Zona în care activați' },
  ],
  'Curățenie': [
    { id: 'tipCuratenie', label: 'Tip serviciu', type: 'select', options: ['Curățenie generală', 'Curățenie birouri', 'Curățenie post-construcție', 'Spălat covoare', 'Spălat canapele', 'Curățenie scări de bloc', 'Altele'], required: true },
    { id: 'zona', label: 'Zonă activitate', type: 'text', placeholder: 'Zona în care activați' },
  ],
  'Instalații': [
    { id: 'tipInstalatie', label: 'Tip instalație', type: 'select', options: ['Sanitare', 'Termice', 'Electrice', 'Gaz', 'Climatizare', 'Ventilație', 'Altele'], required: true },
    { id: 'experienta', label: 'Experiență', type: 'select', options: ['Sub 1 an', '1-3 ani', '3-5 ani', '5-10 ani', 'Peste 10 ani'] },
    { id: 'urgente', label: 'Intervenții urgente', type: 'select', options: ['Da, 24/7', 'Da, în program', 'Nu'] },
  ],
  'IT / Web': [
    { id: 'tipServiciu', label: 'Tip serviciu', type: 'select', options: ['Creare website', 'Dezvoltare aplicații', 'SEO', 'Marketing digital', 'Reparații PC', 'Rețelistică', 'Hosting', 'Consultanță IT', 'Altele'], required: true },
    { id: 'experienta', label: 'Experiență', type: 'select', options: ['Junior', '1-3 ani', '3-5 ani', '5+ ani'] },
  ],
  'Evenimente': [
    { id: 'tipServiciu', label: 'Tip serviciu', type: 'select', options: ['Organizare evenimente', 'DJ', 'Foto/Video', 'Catering', 'Decorațiuni', 'Animatori', 'Muzică live', 'MC/Prezentator', 'Altele'], required: true },
    { id: 'tipEveniment', label: 'Tip eveniment', type: 'select', options: ['Nunți', 'Botezuri', 'Aniversări', 'Corporate', 'Toate tipurile'] },
  ],
  'Educație / Meditații': [
    { id: 'materie', label: 'Materie/Domeniu', type: 'select', options: ['Matematică', 'Română', 'Engleză', 'Franceză', 'Germană', 'Fizică', 'Chimie', 'Biologie', 'Istorie', 'Geografie', 'Informatică', 'Pregătire BAC', 'Pregătire Evaluare', 'Muzică', 'Desen', 'Altele'], required: true },
    { id: 'nivel', label: 'Nivel', type: 'select', options: ['Primar', 'Gimnazial', 'Liceal', 'Universitar', 'Adulți', 'Toate nivelurile'] },
    { id: 'format', label: 'Format', type: 'select', options: ['Online', 'La domiciliul elevului', 'La domiciliul profesorului', 'Toate variantele'] },
  ],
  'Sănătate / Frumusețe': [
    { id: 'tipServiciu', label: 'Tip serviciu', type: 'select', options: ['Coafor/Frizerie', 'Manichiură/Pedichiură', 'Cosmetică', 'Masaj', 'Fitness/Personal trainer', 'Nutriție', 'Îngrijire la domiciliu', 'Altele'], required: true },
    { id: 'experienta', label: 'Experiență', type: 'select', options: ['Sub 1 an', '1-3 ani', '3-5 ani', 'Peste 5 ani'] },
    { id: 'deplasare', label: 'Deplasare la domiciliu', type: 'select', options: ['Da', 'Nu', 'Contra cost'] },
  ],
  'Juridice / Contabilitate': [
    { id: 'tipServiciu', label: 'Tip serviciu', type: 'select', options: ['Consultanță juridică', 'Reprezentare în instanță', 'Acte/Contracte', 'Contabilitate', 'Consultanță fiscală', 'Înființare firmă', 'Altele'], required: true },
    { id: 'experienta', label: 'Experiență', type: 'select', options: ['Sub 5 ani', '5-10 ani', '10-20 ani', 'Peste 20 ani'] },
  ],
  // MODĂ
  'Îmbrăcăminte femei': [
    { id: 'tipArticol', label: 'Tip articol', type: 'select', options: ['Rochii', 'Bluze', 'Pantaloni', 'Fuste', 'Jachete', 'Costume', 'Lenjerie', 'Altele'], required: true },
    { id: 'marime', label: 'Mărime', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'], required: true },
    { id: 'brand', label: 'Brand', type: 'text', placeholder: 'Brand (opțional)' },
  ],
  'Îmbrăcăminte bărbați': [
    { id: 'tipArticol', label: 'Tip articol', type: 'select', options: ['Cămăși', 'Tricouri', 'Pantaloni', 'Costume', 'Jachete', 'Lenjerie', 'Altele'], required: true },
    { id: 'marime', label: 'Mărime', type: 'select', options: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'], required: true },
    { id: 'brand', label: 'Brand', type: 'text', placeholder: 'Brand (opțional)' },
  ],
  'Încălțăminte': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['Pantofi', 'Adidași', 'Sandale', 'Cizme', 'Ghete', 'Papuci'], required: true },
    { id: 'marime', label: 'Mărime', type: 'select', options: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'], required: true },
    { id: 'gen', label: 'Gen', type: 'select', options: ['Femei', 'Bărbați', 'Unisex'] },
    { id: 'brand', label: 'Brand', type: 'text', placeholder: 'Brand (opțional)' },
  ],
  'Genți': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['Geantă mână', 'Rucsac', 'Poșetă', 'Geantă laptop', 'Valiză'], required: true },
    { id: 'material', label: 'Material', type: 'select', options: ['Piele naturală', 'Piele ecologică', 'Textil', 'Altul'] },
  ],
  'Bijuterii': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['Inele', 'Cercei', 'Coliere', 'Brățări', 'Seturi', 'Lănțișoare', 'Pandantive', 'Broșe'], required: true },
    { id: 'material', label: 'Material', type: 'select', options: ['Aur', 'Argint', 'Placat cu aur', 'Placat cu argint', 'Oțel inoxidabil', 'Titan', 'Bijuterie fantazie'] },
    { id: 'karate', label: 'Karate', type: 'select', options: ['9K', '14K', '18K', '22K', '24K', 'N/A'] },
    { id: 'greutate', label: 'Greutate', type: 'number', placeholder: '0', suffix: 'g' },
    { id: 'antic', label: 'Antic/Vintage', type: 'select', options: ['Da', 'Nu'] },
  ],
  'Ceasuri': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['Clasic', 'Sport', 'Smartwatch', 'De lux'], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'Marcă' },
    { id: 'gen', label: 'Gen', type: 'select', options: ['Femei', 'Bărbați', 'Unisex'] },
  ],
  'Ochelari': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['De vedere', 'De soare', 'Sport'], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'Marcă' },
  ],
  // ANIMALE
  'Câini': [
    { id: 'rasa', label: 'Rasă', type: 'select', options: [
      'Metis', 'Labrador Retriever', 'Golden Retriever', 'Ciobănesc German', 'Bulldog Francez',
      'Beagle', 'Pudel', 'Rottweiler', 'Yorkshire Terrier', 'Boxer', 'Husky Siberian',
      'Dachshund (Teckel)', 'Shih Tzu', 'Doberman', 'Border Collie', 'Cavalier King Charles',
      'Chihuahua', 'Bichon Frise', 'Pomeranian', 'Bulldog Englez', 'Pitbull', 'Akita',
      'Malamute', 'Cocker Spaniel', 'Cane Corso', 'Mastiff', 'Shar Pei', 'Chow Chow',
      'Dalmatian', 'Jack Russell Terrier', 'Schnauzer', 'Weimaraner', 'Basset Hound',
      'Ciobănesc Australian', 'Ciobănesc Belgian', 'Samoyede', 'Bull Terrier', 'Altă rasă'
    ], required: true },
    { id: 'varsta', label: 'Vârstă', type: 'select', options: ['Sub 3 luni', '3-6 luni', '6-12 luni', '1-3 ani', '3-7 ani', 'Peste 7 ani'], required: true },
    { id: 'sex', label: 'Sex', type: 'select', options: ['Mascul', 'Femelă'], required: true },
    { id: 'talie', label: 'Talie estimată', type: 'select', options: ['Mică (sub 10 kg)', 'Medie (10-25 kg)', 'Mare (25-45 kg)', 'Foarte mare (peste 45 kg)'] },
    { id: 'culoare', label: 'Culoare', type: 'text', placeholder: 'ex: Maro, Negru, Alb' },
    { id: 'vaccinat', label: 'Vaccinat', type: 'select', options: ['Da, complet', 'Da, parțial', 'Nu', 'Nu știu'], required: true },
    { id: 'deparazitat', label: 'Deparazitat', type: 'select', options: ['Da', 'Nu', 'Nu știu'] },
    { id: 'sterilizat', label: 'Sterilizat/Castrat', type: 'select', options: ['Da', 'Nu', 'Nu știu'] },
    { id: 'microcip', label: 'Microcip', type: 'select', options: ['Da', 'Nu', 'Nu știu'] },
    { id: 'pasaport', label: 'Pașaport/Carnet sănătate', type: 'select', options: ['Da', 'Nu'] },
    { id: 'pedigree', label: 'Pedigree', type: 'select', options: ['Da', 'Nu'] },
    { id: 'codPedigree', label: 'Cod Pedigree', type: 'text', placeholder: 'Introduceți codul pedigree' },
    { id: 'caracter', label: 'Caracter', type: 'text', placeholder: 'ex: Prietenos, energic, bun cu copiii' },
  ],
  'Pisici': [
    { id: 'rasa', label: 'Rasă', type: 'select', options: [
      'Metis/Comună europeană', 'Persană', 'British Shorthair', 'Maine Coon', 'Siameză',
      'Ragdoll', 'Bengal', 'Abisiniană', 'Scottish Fold', 'Sphynx', 'Burmese', 'Birman',
      'Russian Blue', 'Norwegian Forest', 'Exotic Shorthair', 'Devon Rex', 'Cornish Rex',
      'Himalayan', 'Oriental Shorthair', 'Chartreux', 'Somali', 'Turkish Angora', 'Altă rasă'
    ], required: true },
    { id: 'varsta', label: 'Vârstă', type: 'select', options: ['Sub 3 luni', '3-6 luni', '6-12 luni', '1-3 ani', '3-7 ani', 'Peste 7 ani'], required: true },
    { id: 'sex', label: 'Sex', type: 'select', options: ['Mascul', 'Femelă'], required: true },
    { id: 'culoare', label: 'Culoare/Pattern', type: 'select', options: ['Negru', 'Alb', 'Gri', 'Portocaliu', 'Tabby', 'Calico', 'Bicolor', 'Point', 'Altă culoare'] },
    { id: 'blana', label: 'Tip blană', type: 'select', options: ['Scurtă', 'Semi-lungă', 'Lungă', 'Fără blană (Sphynx)'] },
    { id: 'vaccinat', label: 'Vaccinat', type: 'select', options: ['Da, complet', 'Da, parțial', 'Nu', 'Nu știu'], required: true },
    { id: 'deparazitat', label: 'Deparazitat', type: 'select', options: ['Da', 'Nu', 'Nu știu'] },
    { id: 'sterilizat', label: 'Sterilizat/Castrat', type: 'select', options: ['Da', 'Nu', 'Nu știu'] },
    { id: 'microcip', label: 'Microcip', type: 'select', options: ['Da', 'Nu', 'Nu știu'] },
    { id: 'pasaport', label: 'Pașaport/Carnet sănătate', type: 'select', options: ['Da', 'Nu'] },
    { id: 'pedigree', label: 'Pedigree', type: 'select', options: ['Da', 'Nu'] },
    { id: 'codPedigree', label: 'Cod Pedigree', type: 'text', placeholder: 'Introduceți codul pedigree' },
    { id: 'caracter', label: 'Caracter', type: 'text', placeholder: 'ex: Jucăuș, liniștit, sociabil' },
  ],
  'Păsări': [
    { id: 'tipPasare', label: 'Tip pasăre', type: 'select', options: [
      'Papagal', 'Perușă', 'Nimfă', 'Agapornis', 'Canar', 'Cintezoi', 'Sticlete',
      'Porumbei', 'Găini', 'Rațe', 'Gâște', 'Curci', 'Fazani', 'Păuni', 'Prepeliță',
      'Struț', 'Altă pasăre'
    ], required: true },
    { id: 'varsta', label: 'Vârstă', type: 'select', options: ['Pui', 'Tânăr', 'Adult', 'Bătrân', 'Nu știu'] },
    { id: 'sex', label: 'Sex', type: 'select', options: ['Mascul', 'Femelă', 'Nu știu'] },
    { id: 'culoare', label: 'Culoare', type: 'text', placeholder: 'Culoarea penajului' },
    { id: 'vorbeste', label: 'Vorbește (papagali)', type: 'select', options: ['Da', 'Nu', 'Învață', 'N/A'] },
    { id: 'inel', label: 'Inel identificare', type: 'select', options: ['Da', 'Nu'] },
    { id: 'cusca', label: 'Colivie inclusă', type: 'select', options: ['Da', 'Nu'] },
    { id: 'accesorii', label: 'Accesorii incluse', type: 'text', placeholder: 'ex: Colivie, jucării, hrană' },
  ],
  'Pești': [
    { id: 'tipPeste', label: 'Tip pește', type: 'select', options: [
      'Guppy', 'Molly', 'Platy', 'Swordtail', 'Neon Tetra', 'Cardinal Tetra', 'Betta',
      'Scalari', 'Discus', 'Gourami', 'Barbus', 'Corydoras', 'Plecos', 'Crap Koi',
      'Caras auriu', 'Cichlide africane', 'Cichlide sud-americane', 'Pești marini',
      'Creveți', 'Melci', 'Altă specie'
    ], required: true },
    { id: 'cantitate', label: 'Cantitate', type: 'select', options: ['1', '2-5', '6-10', '11-20', 'Peste 20', 'Grup/Banc'] },
    { id: 'marime', label: 'Mărime', type: 'select', options: ['Pui (sub 2cm)', 'Mic (2-5cm)', 'Mediu (5-10cm)', 'Mare (10-20cm)', 'Foarte mare (peste 20cm)'] },
    { id: 'tipApa', label: 'Tip apă', type: 'select', options: ['Dulce tropicală', 'Dulce rece', 'Sărată/Marină', 'Salmastra'], required: true },
    { id: 'acvariu', label: 'Acvariu inclus', type: 'select', options: ['Da', 'Nu'] },
    { id: 'echipament', label: 'Echipament inclus', type: 'text', placeholder: 'ex: Acvariu 100L, filtru, încălzitor' },
  ],
  'Rozătoare': [
    { id: 'tipRozator', label: 'Tip rozător', type: 'select', options: [
      'Hamster', 'Cobai (Porcușor de Guineea)', 'Iepure', 'Chinchilla', 'Degu',
      'Gerbil', 'Șoarece', 'Șobolan', 'Veveriță', 'Altă specie'
    ], required: true },
    { id: 'varsta', label: 'Vârstă', type: 'select', options: ['Pui', 'Tânăr', 'Adult', 'Bătrân', 'Nu știu'] },
    { id: 'sex', label: 'Sex', type: 'select', options: ['Mascul', 'Femelă', 'Nu știu'] },
    { id: 'culoare', label: 'Culoare', type: 'text', placeholder: 'Culoarea blănii' },
    { id: 'cusca', label: 'Cușcă inclusă', type: 'select', options: ['Da', 'Nu'] },
    { id: 'accesorii', label: 'Accesorii incluse', type: 'text', placeholder: 'ex: Cușcă, roată, căsuță' },
  ],
  'Accesorii animale': [
    { id: 'tipAccesoriu', label: 'Tip accesoriu', type: 'select', options: [
      'Hrană', 'Boluri/Hrănitor', 'Cușcă/Țarc', 'Acvariu', 'Zgardă/Lesa', 'Ham',
      'Pat/Saltea', 'Transport (cuști)', 'Jucării', 'Îngrijire/Cosmetice',
      'Haine pentru animale', 'Drezaj', 'Litieră/Toaletă', 'Altele'
    ], required: true },
    { id: 'pentruAnimal', label: 'Pentru animal', type: 'select', options: ['Câine', 'Pisică', 'Pasăre', 'Pește', 'Rozător', 'Reptilă', 'Universal'], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'Marca produsului' },
    { id: 'dimensiune', label: 'Dimensiune', type: 'text', placeholder: 'ex: L, XL, 50x30cm' },
  ],
  'Servicii animale': [
    { id: 'tipServiciu', label: 'Tip serviciu', type: 'select', options: [
      'Frizerie/Grooming', 'Dresaj', 'Pet-sitting', 'Plimbat câini', 'Transport animale',
      'Montă', 'Pensiune animale', 'Veterinar', 'Fotografiere', 'Altele'
    ], required: true },
    { id: 'pentruAnimal', label: 'Pentru animal', type: 'select', options: ['Câini', 'Pisici', 'Păsări', 'Rozătoare', 'Toate animalele'] },
    { id: 'zona', label: 'Zonă deservită', type: 'text', placeholder: 'ex: București, Sector 1-6' },
    { id: 'experienta', label: 'Experiență', type: 'select', options: ['Sub 1 an', '1-3 ani', '3-5 ani', 'Peste 5 ani'] },
    { id: 'program', label: 'Program', type: 'text', placeholder: 'ex: Luni-Vineri 9-18, Weekend' },
    { id: 'deplasare', label: 'Deplasare la domiciliu', type: 'select', options: ['Da', 'Nu', 'Contra cost'] },
  ],
  'Animale de fermă': [
    { id: 'tipAnimal', label: 'Tip animal', type: 'select', options: [
      'Vaci/Boi', 'Cai', 'Oi/Berbeci', 'Capre', 'Porci', 'Găini', 'Rațe', 'Gâște',
      'Curci', 'Iepuri de fermă', 'Prepelițe', 'Struți', 'Albine/Stupi', 'Altele'
    ], required: true },
    { id: 'cantitate', label: 'Cantitate', type: 'text', placeholder: 'ex: 5 buc, 10 capete' },
    { id: 'varsta', label: 'Vârstă', type: 'text', placeholder: 'ex: 2 ani, 6 luni' },
    { id: 'sex', label: 'Sex', type: 'select', options: ['Mascul', 'Femelă', 'Mixt', 'Nu se aplică'] },
    { id: 'rasa', label: 'Rasă', type: 'text', placeholder: 'Rasa animalului' },
    { id: 'greutate', label: 'Greutate', type: 'text', placeholder: 'ex: 500 kg, 30 kg' },
    { id: 'scop', label: 'Scop', type: 'select', options: ['Carne', 'Lapte', 'Reproducție', 'Companie', 'Toate'] },
    { id: 'documente', label: 'Documente sanitare', type: 'select', options: ['Da', 'Nu'] },
  ],
  // CASĂ & GRĂDINĂ
  'Mobilier': [
    { id: 'tipMobilier', label: 'Tip mobilier', type: 'select', options: [
      'Canapea/Colțar', 'Fotoliu', 'Pat', 'Dulap', 'Comodă', 'Birou', 'Masă',
      'Scaune', 'Bibliotecă', 'Mobilier bucătărie', 'Mobilier baie', 'Mobilier exterior'
    ], required: true },
    { id: 'material', label: 'Material', type: 'select', options: ['Lemn masiv', 'PAL/MDF', 'Metal', 'Sticlă', 'Textil', 'Piele', 'Mixt'] },
    { id: 'culoare', label: 'Culoare', type: 'text', placeholder: 'Culoarea mobilierului' },
    { id: 'dimensiuni', label: 'Dimensiuni', type: 'text', placeholder: 'ex: 200x90x85 cm' },
  ],
  'Decorațiuni': [
    { id: 'tipDecoratie', label: 'Tip', type: 'select', options: [
      'Tablouri/Postere', 'Oglinzi', 'Vaze', 'Ceasuri de perete', 'Corpuri iluminat',
      'Covoare', 'Perdele/Draperii', 'Perne decorative', 'Statuete', 'Altele'
    ], required: true },
    { id: 'stil', label: 'Stil', type: 'select', options: ['Modern', 'Clasic', 'Minimalist', 'Rustic', 'Industrial', 'Boho'] },
    { id: 'dimensiuni', label: 'Dimensiuni', type: 'text', placeholder: 'Dimensiunile articolului' },
  ],
  'Grădinărit': [
    { id: 'tip', label: 'Tip produs', type: 'select', options: [
      'Plante', 'Semințe', 'Unelte grădinărit', 'Mobilier grădină', 'Sisteme irigare',
      'Grătare/BBQ', 'Piscine', 'Împrejmuiri', 'Solarii/Sere', 'Îngrășăminte', 'Altele'
    ], required: true },
  ],
  'Unelte': [
    { id: 'tipUnealta', label: 'Tip unealtă', type: 'select', options: [
      'Scule de mână', 'Scule electrice', 'Scule pneumatice', 'Echipamente sudură',
      'Compresoare', 'Generatoare', 'Scări', 'Seturi scule', 'Altele'
    ], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'ex: Bosch, Makita, DeWalt' },
  ],
  'Materiale construcții': [
    { id: 'tipMaterial', label: 'Tip material', type: 'select', options: [
      'Cărămizi/BCA', 'Ciment/Beton', 'Lemn', 'Fier/Metal', 'Izolații', 'Acoperișuri',
      'Pardoseli', 'Gresie/Faianță', 'Vopsele', 'Adezivi', 'Tâmplărie', 'Altele'
    ], required: true },
    { id: 'cantitate', label: 'Cantitate', type: 'text', placeholder: 'ex: 100 buc, 50 mp, 10 mc' },
  ],
  'Instalații sanitare': [
    { id: 'tip', label: 'Tip produs', type: 'select', options: [
      'Căzi/Cabine duș', 'Toalete/WC', 'Chiuvete', 'Robineți', 'Țevi/Fitinguri',
      'Boilere', 'Calorifere', 'Centrale termice', 'Pompe', 'Altele'
    ], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'Marca produsului' },
  ],
  // SPORT & TIMP LIBER
  'Fitness': [
    { id: 'tipEchipament', label: 'Tip echipament', type: 'select', options: [
      'Benzi de alergare', 'Biciclete fitness', 'Eliptice', 'Aparate forță', 'Gantere',
      'Bare/Discuri', 'Bănci', 'Saltele yoga', 'Corzi', 'Benzi elastice', 'Altele'
    ], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'Marca echipamentului' },
  ],
  'Ciclism': [
    { id: 'tipBicicleta', label: 'Tip bicicletă', type: 'select', options: [
      'MTB', 'Cursieră', 'Urbană', 'BMX', 'Electrică', 'Pliabilă', 'Copii',
      'Trotinetă', 'Piese/Accesorii', 'Echipament ciclism'
    ], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'ex: Cube, Giant, Trek' },
    { id: 'marime', label: 'Mărime cadru', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'Nu știu'] },
    { id: 'material', label: 'Material cadru', type: 'select', options: ['Aluminiu', 'Carbon', 'Oțel', 'Titan'] },
  ],
  'Sporturi de echipă': [
    { id: 'sport', label: 'Sport', type: 'select', options: [
      'Fotbal', 'Baschet', 'Volei', 'Handbal', 'Tenis', 'Badminton', 'Ping-pong',
      'Rugby', 'Baseball', 'Hockey', 'Altul'
    ], required: true },
    { id: 'tipArticol', label: 'Tip articol', type: 'select', options: ['Minge', 'Echipament', 'Încălțăminte', 'Poartă/Plasă', 'Accesorii'] },
  ],
  'Sporturi de iarnă': [
    { id: 'sport', label: 'Sport', type: 'select', options: ['Schi', 'Snowboard', 'Patinaj', 'Săniuș', 'Altul'], required: true },
    { id: 'tipArticol', label: 'Tip articol', type: 'select', options: ['Schiuri/Placă', 'Clăpari/Legături', 'Bețe', 'Cască', 'Ochelari', 'Îmbrăcăminte', 'Accesorii'] },
    { id: 'marime', label: 'Mărime', type: 'text', placeholder: 'ex: 42, L, 165cm' },
  ],
  'Camping': [
    { id: 'tipArticol', label: 'Tip articol', type: 'select', options: [
      'Corturi', 'Saci de dormit', 'Saltele', 'Rucsacuri', 'Echipament gătit',
      'Lămpi/Lanterne', 'Mobilier camping', 'Hămace', 'Altele'
    ], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'Marca produsului' },
  ],
  'Pescuit / Vânătoare': [
    { id: 'tip', label: 'Categorie', type: 'select', options: ['Pescuit', 'Vânătoare'], required: true },
    { id: 'tipArticol', label: 'Tip articol', type: 'select', options: [
      'Lansete/Undițe', 'Mulinete', 'Fire/Ace', 'Momeli', 'Scaune', 'Umbrele',
      'Arme vânătoare', 'Optice', 'Îmbrăcăminte', 'Accesorii', 'Altele'
    ], required: true },
  ],
  'Hobby': [
    { id: 'tipHobby', label: 'Tip hobby', type: 'select', options: [
      'Colecții', 'Modelism', 'Pictură/Desen', 'Lucru manual', 'Muzică/Instrumente',
      'Fotografie', 'Astronomie', 'Numismatică', 'Filatelie', 'Altele'
    ], required: true },
    { id: 'descriereArticol', label: 'Articol', type: 'text', placeholder: 'Descriere scurtă a articolului' },
  ],
  'Cărți / Muzică': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['Cărți', 'CD/DVD', 'Vinil', 'Instrumente muzicale', 'Alte materiale audio'], required: true },
    { id: 'gen', label: 'Gen/Categorie', type: 'text', placeholder: 'ex: Roman, Rock, Chitară' },
    { id: 'autor', label: 'Autor/Artist', type: 'text', placeholder: 'Autor sau artist' },
  ],
  // MAMA & COPIL
  'Îmbrăcăminte copii': [
    { id: 'tipArticol', label: 'Tip articol', type: 'select', options: [
      'Body/Salopete', 'Tricouri', 'Bluze', 'Pantaloni', 'Rochii/Fuste',
      'Pulovere', 'Geci', 'Costume', 'Pijamale', 'Lenjerie', 'Seturi'
    ], required: true },
    { id: 'marime', label: 'Mărime/Vârstă', type: 'select', options: ['0-3 luni', '3-6 luni', '6-12 luni', '12-18 luni', '18-24 luni', '2-3 ani', '3-4 ani', '4-5 ani', '5-6 ani', '6-8 ani', '8-10 ani', '10-12 ani', '12-14 ani'], required: true },
    { id: 'sex', label: 'Sex', type: 'select', options: ['Băiat', 'Fată', 'Unisex'] },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'Marca articolului' },
  ],
  'Încălțăminte copii': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['Botoșei', 'Sandale', 'Pantofi', 'Adidași', 'Cizme', 'Ghete', 'Papuci'], required: true },
    { id: 'marime', label: 'Mărime', type: 'select', options: ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38'], required: true },
    { id: 'sex', label: 'Sex', type: 'select', options: ['Băiat', 'Fată', 'Unisex'] },
  ],
  'Jucării': [
    { id: 'tipJucarie', label: 'Tip jucărie', type: 'select', options: [
      'Păpuși', 'Mașinuțe/Vehicule', 'LEGO/Construcții', 'Jocuri de societate',
      'Jucării educative', 'Jucării de pluș', 'Jucării exterior', 'Jucării bebeluși',
      'Figurine', 'Instrumente muzicale copii', 'Altele'
    ], required: true },
    { id: 'varsta', label: 'Vârstă recomandată', type: 'select', options: ['0-12 luni', '1-2 ani', '2-3 ani', '3-5 ani', '5-8 ani', '8-12 ani', '12+ ani', 'Toate vârstele'] },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'ex: LEGO, Barbie, Fisher-Price' },
  ],
  'Cărucioare': [
    { id: 'tipCarucior', label: 'Tip cărucior', type: 'select', options: [
      'Landou', 'Cărucior sport', 'Sistem 2 în 1', 'Sistem 3 în 1', 'Cărucior geamăn',
      'Trotinete/Triciclete', 'Scoici auto', 'Scaune auto'
    ], required: true },
    { id: 'marca', label: 'Marcă', type: 'select', options: ['Chicco', 'Cybex', 'Joie', 'Inglesina', 'Maxi-Cosi', 'Stokke', 'Baby Design', 'Altă marcă'] },
    { id: 'culoare', label: 'Culoare', type: 'text', placeholder: 'Culoarea căruciorului' },
    { id: 'accesorii', label: 'Accesorii incluse', type: 'text', placeholder: 'ex: Geantă, husă ploaie, plasă' },
  ],
  'Mobilier copii': [
    { id: 'tipMobilier', label: 'Tip mobilier', type: 'select', options: [
      'Pătuț', 'Pat junior', 'Saltea', 'Dulap', 'Comodă', 'Scaun masă',
      'Balansoar', 'Țarc', 'Birou copii', 'Altele'
    ], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'Marca mobilierului' },
    { id: 'dimensiuni', label: 'Dimensiuni', type: 'text', placeholder: 'ex: 120x60 cm' },
  ],
  'Articole pentru bebeluși': [
    { id: 'tipArticol', label: 'Tip articol', type: 'select', options: [
      'Biberoane/Suzete', 'Sterilizatoare', 'Pompe sân', 'Căni/Tacâmuri',
      'Prosoape/Scutece textile', 'Cadă bebeluș', 'Monitor bebeluș',
      'Marsupiu/Wrap', 'Pernă alăptare', 'Altele'
    ], required: true },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'Marca produsului' },
  ],
  // TURISM
  'Hoteluri': [
    { id: 'stele', label: 'Clasificare', type: 'select', options: ['1 stea', '2 stele', '3 stele', '4 stele', '5 stele'], required: true },
    { id: 'tipCamera', label: 'Tip cameră', type: 'select', options: ['Single', 'Double', 'Twin', 'Triple', 'Apartament', 'Suită'] },
    { id: 'facilitati', label: 'Facilități', type: 'text', placeholder: 'ex: WiFi, Piscină, Spa, Restaurant' },
  ],
  'Pensiuni': [
    { id: 'clasificare', label: 'Clasificare', type: 'select', options: ['1 margaretă', '2 margarete', '3 margarete', '4 margarete', '5 margarete'], required: true },
    { id: 'capacitate', label: 'Capacitate', type: 'text', placeholder: 'ex: 10 camere, 30 locuri' },
    { id: 'facilitati', label: 'Facilități', type: 'text', placeholder: 'ex: WiFi, Grătar, Parcare' },
  ],
  'Apartamente turistice': [
    { id: 'camere', label: 'Camere', type: 'select', options: ['Garsonieră', '1 cameră', '2 camere', '3 camere', '4+ camere'], required: true },
    { id: 'capacitate', label: 'Capacitate', type: 'select', options: ['2 persoane', '4 persoane', '6 persoane', '8+ persoane'] },
    { id: 'facilitati', label: 'Facilități', type: 'text', placeholder: 'ex: WiFi, AC, Bucătărie, Parcare' },
  ],
  'Vile': [
    { id: 'camere', label: 'Dormitoare', type: 'select', options: ['2', '3', '4', '5', '6+'], required: true },
    { id: 'capacitate', label: 'Capacitate', type: 'select', options: ['4 persoane', '6 persoane', '8 persoane', '10 persoane', '12+ persoane'] },
    { id: 'facilitati', label: 'Facilități', type: 'text', placeholder: 'ex: Piscină, Grătar, Jacuzzi' },
  ],
  'Excursii': [
    { id: 'destinatie', label: 'Destinație', type: 'text', placeholder: 'Destinația excursiei', required: true },
    { id: 'durata', label: 'Durată', type: 'select', options: ['1 zi', '2-3 zile', '4-7 zile', '1-2 săptămâni', 'Peste 2 săptămâni'] },
    { id: 'transport', label: 'Transport', type: 'select', options: ['Autocar', 'Avion', 'Individual', 'Inclus'] },
    { id: 'tip', label: 'Tip excursie', type: 'select', options: ['Relaxare', 'Circuit', 'Aventură', 'City break', 'Croazieră'] },
  ],
  'Bilete / Vouchere': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['Bilet avion', 'Bilet tren', 'Voucher hotel', 'Voucher spa', 'Bilet eveniment', 'Altul'], required: true },
    { id: 'valabilitate', label: 'Valabilitate', type: 'text', placeholder: 'Data expirării' },
    { id: 'detalii', label: 'Detalii', type: 'text', placeholder: 'ex: 2 nopți, București-Paris' },
  ],
  // GAMING / VIDEOJOCURI
  'PlayStation': [
    { id: 'tip', label: 'Tip produs', type: 'select', options: ['Consolă', 'Joc', 'Accesoriu'], required: true },
    { id: 'versiune', label: 'Versiune', type: 'select', options: ['PS5', 'PS4', 'PS4 Pro', 'PS3', 'PS Vita', 'PS2'], required: true },
    { id: 'titluJoc', label: 'Titlu joc', type: 'text', placeholder: 'Numele jocului (dacă e cazul)' },
  ],
  'Xbox': [
    { id: 'tip', label: 'Tip produs', type: 'select', options: ['Consolă', 'Joc', 'Accesoriu'], required: true },
    { id: 'versiune', label: 'Versiune', type: 'select', options: ['Xbox Series X', 'Xbox Series S', 'Xbox One X', 'Xbox One S', 'Xbox One', 'Xbox 360'], required: true },
    { id: 'titluJoc', label: 'Titlu joc', type: 'text', placeholder: 'Numele jocului (dacă e cazul)' },
  ],
  'Nintendo': [
    { id: 'tip', label: 'Tip produs', type: 'select', options: ['Consolă', 'Joc', 'Accesoriu'], required: true },
    { id: 'versiune', label: 'Versiune', type: 'select', options: ['Switch OLED', 'Switch', 'Switch Lite', '3DS', 'Wii U', 'Wii', 'DS', 'Game Boy'], required: true },
    { id: 'titluJoc', label: 'Titlu joc', type: 'text', placeholder: 'Numele jocului (dacă e cazul)' },
  ],
  'PC Gaming': [
    { id: 'tip', label: 'Tip produs', type: 'select', options: ['PC complet', 'Componentă', 'Periferic', 'Joc (fizic)'], required: true },
    { id: 'componenta', label: 'Componentă/Periferic', type: 'select', options: ['Placă video', 'Procesor', 'RAM', 'SSD/HDD', 'Monitor', 'Tastatură', 'Mouse', 'Căști', 'Scaun gaming', 'Altul'] },
    { id: 'specificatii', label: 'Specificații', type: 'text', placeholder: 'ex: RTX 4070, i7-13700K' },
  ],
  'Jocuri': [
    { id: 'platforma', label: 'Platformă', type: 'select', options: ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Multi-platformă'], required: true },
    { id: 'format', label: 'Format', type: 'select', options: ['Fizic (disc)', 'Digital (cod)', 'Cont cu jocuri'], required: true },
    { id: 'titlu', label: 'Titlu', type: 'text', placeholder: 'Numele jocului', required: true },
  ],
  'Accesorii gaming': [
    { id: 'tipAccesoriu', label: 'Tip accesoriu', type: 'select', options: [
      'Controller', 'Căști', 'Tastatură', 'Mouse', 'Mousepad', 'Monitor',
      'Webcam', 'Microfon', 'Scaun gaming', 'Birou gaming', 'Iluminare RGB', 'Altele'
    ], required: true },
    { id: 'compatibilitate', label: 'Compatibilitate', type: 'select', options: ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Universal'] },
    { id: 'marca', label: 'Marcă', type: 'text', placeholder: 'ex: Razer, Logitech, SteelSeries' },
  ],
  'Retro gaming': [
    { id: 'tip', label: 'Tip', type: 'select', options: ['Consolă retro', 'Joc retro', 'Accesoriu retro', 'Consolă mini/replica'], required: true },
    { id: 'platforma', label: 'Platformă', type: 'text', placeholder: 'ex: NES, SEGA, Atari' },
    { id: 'completitudine', label: 'Completitudine', type: 'select', options: ['CIB (Complete in Box)', 'Doar joc', 'Doar cutie', 'Loose'] },
  ],
};

type Step = 'categoria' | 'subcategoria' | 'detalles';

export default function PublishPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, userProfile, loading: authLoading } = useAuth();
  
  // Estados principales
  const [step, setStep] = useState<Step>('categoria');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [subcategoria, setSubcategoria] = useState('');
  
  // Estados del formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [moneda, setMoneda] = useState<'LEI' | 'EUR'>('LEI');
  const [condicion, setCondicion] = useState<string>('');
  const [negociable, setNegociable] = useState(false);
  const [tipPersoana, setTipPersoana] = useState<'fizica' | 'juridica'>('fizica');
  const [ubicacion, setUbicacion] = useState('');
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  
  // Estados UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/publish');
    }
  }, [user, authLoading, router]);

  // Campos dinámicos para la subcategoría actual
  const subcategoryFields = SUBCATEGORY_FIELDS[subcategoria] || [];

  // Handlers de imágenes
  const handleAddImages = (files: FileList) => {
    const newFiles = Array.from(files).slice(0, 8 - imagenes.length);
    setImagenes([...imagenes, ...newFiles]);
    
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  // Handlers de navegación
  const handleBackToCategoria = () => {
    setCategoria(null);
    setSubcategoria('');
    setCustomFields({});
    setStep('categoria');
  };

  const handleBackToSubcategoria = () => {
    setSubcategoria('');
    setCustomFields({});
    setStep('subcategoria');
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFields(prev => ({ ...prev, [fieldId]: value }));
  };

  const filteredCities = CITIES.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  ).slice(0, 10);

  const handleSelectCategory = (cat: string) => {
    setCategoria(cat);
    setStep('subcategoria');
  };

  const handleSelectSubcategory = (subcat: string) => {
    setSubcategoria(subcat);
    setCustomFields({});
    setStep('detalles');
  };

  // Validación
  const requiredFieldsFilled = subcategoryFields
    .filter(f => f.required)
    .every(f => customFields[f.id] && customFields[f.id].trim() !== '');

  const isLocuriDeMunca = categoria === 'locuri-de-munca';
  const isImobiliare = categoria === 'imobiliare';
  const imagenesValidas = isLocuriDeMunca || previews.length >= 1;

  const isValid = categoria && subcategoria && titulo.length >= 5 && descripcion.length >= 20 &&
    (isLocuriDeMunca || precio) && ubicacion && imagenesValidas && requiredFieldsFilled;

  // Completitud de secciones
  const sectionComplete = {
    imagenes: imagenesValidas,
    detalii: titulo.length >= 5 && descripcion.length >= 20,
    caracteristici: subcategoryFields.length === 0 || requiredFieldsFilled,
    pret: isLocuriDeMunca || !!precio,
    locatie: !!ubicacion,
  };

  const applicableSections = subcategoryFields.length > 0 ? 5 : 4;
  const completedCount = Object.values(sectionComplete).filter(Boolean).length;

  // Submit
  const handleSubmit = async () => {
    if (!isValid || !user || !userProfile) return;
    
    setLoading(true);
    setError('');

    try {
      // Subir imágenes a Firebase Storage
      let imageUrls: string[] = [];
      if (imagenes.length > 0) {
        imageUrls = await uploadProductImages(imagenes, user.uid);
      }
      
      // Si no hay imágenes, usar placeholder local
      if (imageUrls.length === 0) {
        imageUrls = ['/placeholder-product.svg'];
      }

      const productData = {
        title: titulo.trim(),
        description: descripcion.trim(),
        price: parseFloat(precio) || 0,
        currency: moneda,
        category: categoria || '',
        subcategory: subcategoria,
        condition: condicion,
        negotiable: negociable,
        location: ubicacion,
        image: imageUrls[0],
        images: imageUrls,
        customFields: customFields,
        sellerId: user.uid,
        seller: {
          id: user.uid,
          name: userProfile.displayName || 'Usuario',
          rating: userProfile.rating || 0,
          reviews: userProfile.reviewsCount || 0,
          avatar: userProfile.photoURL || '',
          joined: new Date().getFullYear().toString(),
        },
      };

      await createProduct(productData);
      
      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      console.error('Error publishing:', err);
      setError(err.message || 'Eroare la publicare');
    } finally {
      setLoading(false);
    }
  };

  // Success
  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 shadow-xl">
          <div className="w-24 h-24 bg-gradient-to-br from-[#13C1AC] to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Publicat cu succes!</h2>
          <p className="text-gray-500">Redirecționare...</p>
        </div>
      </div>
    );
  }

  // =============================================================================
  // PANTALLA 1: SELECCIÓN DE CATEGORÍA
  // =============================================================================
  if (step === 'categoria') {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-gray-800 font-semibold text-lg">Creează anunț</h1>
            <div className="w-6" />
          </div>
        </div>

        {/* Contenido */}
        <div className="px-4 py-8 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Alege categoria</h2>
            <p className="text-gray-500">Selectează categoria potrivită pentru anunțul tău</p>
          </div>

          {/* Grid de categorías */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className="group flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl shadow-sm border border-gray-200 
                    hover:shadow-md hover:border-[#13C1AC] transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-full border border-gray-100 bg-gray-50 flex items-center justify-center
                    group-hover:bg-[#13C1AC] group-hover:border-[#13C1AC] transition-all text-gray-500 group-hover:text-white shadow-sm">
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#13C1AC] text-center">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // PANTALLA 2: SELECCIÓN DE SUBCATEGORÍA
  // =============================================================================
  if (step === 'subcategoria' && categoria) {
    const currentCategory = CATEGORIES.find(c => c.id === categoria);
    const subcategoriesList = SUBCATEGORIES[categoria] || [];
    
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button 
              onClick={handleBackToCategoria} 
              className="text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-2 min-w-[80px]"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Înapoi</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 shadow-sm">
                {(() => {
                  const Icon = currentCategory?.icon || Home;
                  return <Icon className="w-4 h-4" />;
                })()}
              </div>
              <span className="text-gray-800 font-medium text-sm">
                {currentCategory?.name}
              </span>
            </div>
            <div className="min-w-[80px]" />
          </div>
        </div>

        {/* Contenido */}
        <div className="px-4 py-8 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Alege subcategoria</h2>
            <p className="text-gray-500">Selectează subcategoria potrivită</p>
          </div>

          {/* Grid de subcategorías */}
          <div className="grid grid-cols-2 gap-3">
            {subcategoriesList.map((subcat) => (
              <button
                key={subcat.name}
                onClick={() => handleSelectSubcategory(subcat.name)}
                className="p-4 rounded-xl bg-white shadow-sm
                  hover:bg-gray-50 hover:shadow-md transition-all duration-300
                  text-left group flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center 
                  group-hover:bg-[#13C1AC]/10 transition-colors">
                  <subcat.icon className="w-5 h-5 text-gray-500 group-hover:text-[#13C1AC] transition-colors" />
                </div>
                <span className="text-gray-700 font-medium text-sm group-hover:text-[#13C1AC] transition-colors">
                  {subcat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // PANTALLA 3: FORMULARIO DE DETALLES
  // =============================================================================
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={handleBackToSubcategoria} 
            className="text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Înapoi</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 shadow-sm">
              {(() => {
                const Icon = CATEGORIES.find(c => c.id === categoria)?.icon || Home;
                return <Icon className="w-3.5 h-3.5" />;
              })()}
            </div>
            <div className="flex flex-col">
              <span className="text-gray-800 font-medium text-sm leading-tight">
                {CATEGORIES.find(c => c.id === categoria)?.name}
              </span>
              <span className="text-gray-500 text-xs leading-tight">
                {subcategoria}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{completedCount}/{applicableSections}</span>
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#13C1AC] to-emerald-500 transition-all duration-300"
                style={{ width: `${(completedCount / applicableSections) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 pb-32 px-4 max-w-2xl mx-auto">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleAddImages(e.target.files)}
          className="hidden"
        />

        {/* Formulario compacto en una sola tarjeta */}
        <div className="bg-white rounded-3xl shadow-sm">
          
          {/* Sección: Fotografii */}
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isLocuriDeMunca || sectionComplete.imagenes ? 'bg-gradient-to-br from-[#13C1AC] to-emerald-500' : 'bg-gray-100'
              }`}>
                {isLocuriDeMunca || sectionComplete.imagenes ? <Check className="w-5 h-5 text-white" /> : <Camera className="w-5 h-5 text-gray-400" />}
              </div>
              <div>
                <p className="text-gray-800 font-medium">
                  {isLocuriDeMunca ? 'Imagine anunț' : 'Fotografii'}
                </p>
                <p className="text-gray-500 text-xs">
                  {isLocuriDeMunca ? 'Imagine profesională inclusă' : `${previews.length}/8 adăugate`}
                </p>
              </div>
            </div>
            
            {isLocuriDeMunca ? (
              <div className="space-y-3">
                {previews.length === 0 ? (
                  <>
                    <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600
                      flex items-center justify-center gap-4 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                          <Briefcase className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-bold text-lg tracking-wide">LOCURI DE MUNCĂ</p>
                          <p className="text-blue-100 text-sm font-medium">Oportunități de carieră</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400
                        flex items-center justify-center gap-2 transition-all bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-sm font-medium">Sau adaugă propria imagine</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        {index === 0 && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded font-medium">
                            Cover
                          </div>
                        )}
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Trash2 className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ))}
                    {previews.length < 8 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400
                          flex items-center justify-center transition-all hover:bg-blue-50"
                      >
                        <Plus className="w-6 h-6 text-gray-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : previews.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#13C1AC]
                  flex items-center justify-center gap-3 transition-all bg-gray-50 hover:bg-[#13C1AC]/5"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#13C1AC] to-emerald-500 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <p className="text-gray-500 text-sm">Adaugă fotografii</p>
              </button>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    {index === 0 && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#13C1AC] text-white text-[10px] rounded font-medium">
                        Cover
                      </div>
                    )}
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
                {previews.length < 8 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#13C1AC]
                      flex items-center justify-center transition-all hover:bg-[#13C1AC]/5"
                  >
                    <Plus className="w-6 h-6 text-gray-400" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sección: Detalii */}
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                sectionComplete.detalii ? 'bg-gradient-to-br from-[#13C1AC] to-emerald-500' : 'bg-gray-100'
              }`}>
                {sectionComplete.detalii ? <Check className="w-5 h-5 text-white" /> : <Type className="w-5 h-5 text-gray-400" />}
              </div>
              <div>
                <p className="text-gray-800 font-medium">Detalii</p>
                <p className="text-gray-500 text-xs">Titlu și descriere</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Titlu anunț"
                  maxLength={100}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-800 placeholder-gray-400
                    focus:outline-none focus:bg-white transition-all text-sm ${
                      titulo.length >= 5 ? 'border-[#13C1AC]' : 'border-gray-200 focus:border-[#13C1AC]'
                    }`}
                />
                <p className={`text-xs mt-1.5 ${titulo.length >= 5 ? 'text-green-500' : 'text-gray-400'}`}>
                  {titulo.length}/100 caractere {titulo.length < 5 && `(min. 5)`} {titulo.length >= 5 && '✓'}
                </p>
              </div>

              <div>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descriere detaliată..."
                  rows={3}
                  maxLength={2000}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-800 placeholder-gray-400
                    focus:outline-none focus:bg-white transition-all resize-none text-sm ${
                      descripcion.length >= 20 ? 'border-[#13C1AC]' : 'border-gray-200 focus:border-[#13C1AC]'
                    }`}
                />
                <p className={`text-xs mt-1.5 ${descripcion.length >= 20 ? 'text-green-500' : 'text-gray-400'}`}>
                  {descripcion.length}/2000 caractere {descripcion.length < 20 && `(min. 20)`} {descripcion.length >= 20 && '✓'}
                </p>
              </div>

              {/* Stare - Opciones específicas por categoría */}
              {!isLocuriDeMunca && !isImobiliare && categoria !== 'matrimoniale' && categoria !== 'servicii' && categoria !== 'turism' && (
                <div>
                  <label className="text-gray-600 text-xs mb-2 block">Stare</label>
                  <div className="flex flex-wrap gap-2">
                    {/* Electronice y Gaming */}
                    {(categoria === 'electronice' || categoria === 'gaming') && [
                      { id: 'nou-sigilat', label: 'Nou (sigilat)', icon: Package },
                      { id: 'nou-desigilat', label: 'Nou (desigilat)', icon: Star },
                      { id: 'ca-nou', label: 'Ca nou', icon: Sparkles },
                      { id: 'folosit-functional', label: 'Folosit - funcțional', icon: Check },
                      { id: 'defect', label: 'Defect / Pentru piese', icon: Users },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setCondicion(item.id)}
                        className={`px-4 py-2.5 rounded-full flex items-center gap-2 transition-all text-sm ${
                          condicion === item.id
                            ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white shadow-md'
                            : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}

                    {/* Auto-moto */}
                    {categoria === 'auto-moto' && [
                      { id: 'nou', label: 'Nou', icon: Star },
                      { id: 'folosit', label: 'Folosit', icon: Check },
                      { id: 'accidentat', label: 'Accidentat', icon: AlertCircle },
                      { id: 'pentru-piese', label: 'Pentru piese', icon: Wrench },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setCondicion(item.id)}
                        className={`px-4 py-2.5 rounded-full flex items-center gap-2 transition-all text-sm ${
                          condicion === item.id
                            ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white shadow-md'
                            : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}

                    {/* Modă */}
                    {categoria === 'moda' && [
                      { id: 'nou-eticheta', label: 'Nou cu etichetă', icon: Package },
                      { id: 'nou-fara-eticheta', label: 'Nou fără etichetă', icon: Star },
                      { id: 'ca-nou', label: 'Ca nou', icon: Sparkles },
                      { id: 'folosit', label: 'Folosit', icon: Check },
                      { id: 'vintage', label: 'Vintage', icon: Clock },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setCondicion(item.id)}
                        className={`px-4 py-2.5 rounded-full flex items-center gap-2 transition-all text-sm ${
                          condicion === item.id
                            ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white shadow-md'
                            : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}

                    {/* Copii */}
                    {categoria === 'copii' && [
                      { id: 'nou-eticheta', label: 'Nou cu etichetă', icon: Package },
                      { id: 'nou', label: 'Nou', icon: Star },
                      { id: 'ca-nou', label: 'Ca nou', icon: Sparkles },
                      { id: 'folosit', label: 'Folosit', icon: Check },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setCondicion(item.id)}
                        className={`px-4 py-2.5 rounded-full flex items-center gap-2 transition-all text-sm ${
                          condicion === item.id
                            ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white shadow-md'
                            : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}

                    {/* Sport */}
                    {categoria === 'sport' && [
                      { id: 'nou', label: 'Nou', icon: Star },
                      { id: 'ca-nou', label: 'Ca nou', icon: Sparkles },
                      { id: 'folosit', label: 'Folosit', icon: Check },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setCondicion(item.id)}
                        className={`px-4 py-2.5 rounded-full flex items-center gap-2 transition-all text-sm ${
                          condicion === item.id
                            ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white shadow-md'
                            : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}

                    {/* Casă & Grădină */}
                    {categoria === 'casa-gradina' && [
                      { id: 'nou', label: 'Nou', icon: Star },
                      { id: 'ca-nou', label: 'Ca nou', icon: Sparkles },
                      { id: 'folosit', label: 'Folosit', icon: Check },
                      { id: 'renovat', label: 'Renovat/Recondiționat', icon: Wrench },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setCondicion(item.id)}
                        className={`px-4 py-2.5 rounded-full flex items-center gap-2 transition-all text-sm ${
                          condicion === item.id
                            ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white shadow-md'
                            : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}

                    {/* Animale - opciones diferentes */}
                    {categoria === 'animale' && [
                      { id: 'disponibil', label: 'Disponibil', icon: Check },
                      { id: 'rezervat', label: 'Rezervat', icon: Clock },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setCondicion(item.id)}
                        className={`px-4 py-2.5 rounded-full flex items-center gap-2 transition-all text-sm ${
                          condicion === item.id
                            ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white shadow-md'
                            : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tipo de persona */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setTipPersoana('fizica')}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm ${
                    tipPersoana === 'fizica'
                      ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Persoană fizică
                </button>
                <button
                  onClick={() => setTipPersoana('juridica')}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm ${
                    tipPersoana === 'juridica'
                      ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Persoană juridică
                </button>
              </div>
            </div>
          </div>

          {/* Sección: Caracteristici specifice (campos dinámicos) */}
          {subcategoryFields.length > 0 && (
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  requiredFieldsFilled ? 'bg-gradient-to-br from-[#13C1AC] to-emerald-500' : 'bg-gray-100'
                }`}>
                  {requiredFieldsFilled ? <Check className="w-5 h-5 text-white" /> : <Briefcase className="w-5 h-5 text-gray-400" />}
                </div>
                <div>
                  <p className="text-gray-800 font-medium">Caracteristici {subcategoria}</p>
                  <p className="text-gray-500 text-xs">Detalii specifice categoriei</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {subcategoryFields.map((field) => (
                  <div key={field.id} className={field.type === 'text' && !field.suffix ? 'col-span-2' : ''}>
                    <label className="text-gray-600 text-xs mb-1.5 block">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {field.type === 'select' ? (
                      <div className="relative">
                        <select
                          value={customFields[field.id] || ''}
                          onChange={(e) => {
                            handleCustomFieldChange(field.id, e.target.value);
                            // Si cambia la marca de teléfono, resetear el modelo
                            if (field.id === 'marca' && subcategoria === 'Telefoane') {
                              handleCustomFieldChange('model', '');
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm
                            focus:outline-none focus:border-[#13C1AC] focus:bg-white appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-white">Selectează...</option>
                          {/* Modelos dinámicos para teléfonos */}
                          {field.id === 'model' && subcategoria === 'Telefoane' && customFields['marca'] ? (
                            (PHONE_MODELS[customFields['marca']] || ['Alt model']).map(opt => (
                              <option key={opt} value={opt} className="bg-white">{opt}</option>
                            ))
                          ) : (
                            field.options?.map(opt => (
                              <option key={opt} value={opt} className="bg-white">{opt}</option>
                            ))
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    ) : field.type === 'number' ? (
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={customFields[field.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            handleCustomFieldChange(field.id, val);
                          }}
                          placeholder={field.placeholder || '0'}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm
                            focus:outline-none focus:border-[#13C1AC] focus:bg-white placeholder-gray-400"
                        />
                        {field.suffix && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            {field.suffix}
                          </span>
                        )}
                      </div>
                    ) : field.type === 'tire-size' ? (
                      <input
                        type="text"
                        value={customFields[field.id] || ''}
                        onChange={(e) => {
                          // Solo números
                          const digits = e.target.value.replace(/[^0-9]/g, '');
                          let val = '';
                          // Auto-formatear: 205/55/R16
                          if (digits.length <= 3) {
                            val = digits;
                          } else if (digits.length <= 5) {
                            val = digits.slice(0, 3) + '/' + digits.slice(3);
                          } else {
                            val = digits.slice(0, 3) + '/' + digits.slice(3, 5) + '/R' + digits.slice(5, 7);
                          }
                          handleCustomFieldChange(field.id, val);
                        }}
                        placeholder={field.placeholder || '205/55/R16'}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm
                          focus:outline-none focus:border-[#13C1AC] focus:bg-white placeholder-gray-400"
                      />
                    ) : (
                      <input
                        type="text"
                        value={customFields[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm
                          focus:outline-none focus:border-[#13C1AC] focus:bg-white placeholder-gray-400"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Preț - Ocultar para Locuri de muncă */}
          {!isLocuriDeMunca && (
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  sectionComplete.pret ? 'bg-gradient-to-br from-[#13C1AC] to-emerald-500' : 'bg-gray-100'
                }`}>
                  {sectionComplete.pret ? <Check className="w-5 h-5 text-white" /> : <DollarSign className="w-5 h-5 text-gray-400" />}
                </div>
                <div>
                  <p className="text-gray-800 font-medium">Preț</p>
                  <p className="text-gray-500 text-xs">Setează prețul</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={precio}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPrecio(val);
                    }}
                    placeholder="0"
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xl font-bold placeholder-gray-400
                      focus:outline-none focus:border-[#13C1AC] focus:bg-white transition-all"
                  />
                  <div className="flex rounded-xl overflow-hidden border border-gray-200">
                    <button
                      onClick={() => setMoneda('LEI')}
                      className={`px-4 py-3 font-medium text-sm transition-all ${
                        moneda === 'LEI' 
                          ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      LEI
                    </button>
                    <button
                      onClick={() => setMoneda('EUR')}
                      className={`px-4 py-3 font-medium text-sm transition-all ${
                        moneda === 'EUR' 
                          ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      EUR
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setNegociable(!negociable)}
                  className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm ${
                    negociable
                      ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Negociabil
                </button>
              </div>
            </div>
          )}

          {/* Sección: Locație */}
          <div className="p-5 overflow-visible">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                sectionComplete.locatie ? 'bg-gradient-to-br from-[#13C1AC] to-emerald-500' : 'bg-gray-100'
              }`}>
                {sectionComplete.locatie ? <Check className="w-5 h-5 text-white" /> : <Navigation className="w-5 h-5 text-gray-400" />}
              </div>
              <div>
                <p className="text-gray-800 font-medium">Locație</p>
                <p className="text-gray-500 text-xs">Selectează orașul</p>
              </div>
            </div>
            
            <div className="space-y-3 overflow-visible">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => { setCitySearch(e.target.value); setShowCityDropdown(true); }}
                  onFocus={() => setShowCityDropdown(true)}
                  placeholder="Caută orașul..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 text-sm
                    focus:outline-none focus:border-[#13C1AC] focus:bg-white transition-all"
                />
                
                {showCityDropdown && citySearch.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl max-h-60 overflow-y-auto">
                    {filteredCities.length > 0 ? (
                      filteredCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => { setUbicacion(city); setCitySearch(city); setShowCityDropdown(false); }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm border-b border-gray-100 last:border-b-0 ${
                            ubicacion === city ? 'bg-[#13C1AC]/10 text-[#13C1AC]' : 'text-gray-700'
                          }`}
                        >
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="flex-1">{city}</span>
                          {ubicacion === city && <Check className="w-4 h-4 text-[#13C1AC]" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-sm text-center">
                        Nu s-a găsit orașul "{citySearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
              isValid
                ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white shadow-lg shadow-[#13C1AC]/30'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Se publică...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Publică anunțul
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
