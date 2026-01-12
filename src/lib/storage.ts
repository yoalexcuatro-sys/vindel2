export interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  images?: string[];
  location: string;
  description: string;
  condition: string;
  category?: string;
  subcategory?: string;
  customFields?: Record<string, string>;
  views?: number;
  reserved?: boolean;
  seller: {
      id: number;
      name: string;
      rating?: number;
      reviews?: number;
      avatar: string;
      joined?: string;
  };
  publishedAt?: string;
}

export function getProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('wallapop_clone_products');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load products", e);
    return [];
  }
}

export function saveProducts(products: Product[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('wallapop_clone_products', JSON.stringify(products));
  } catch (e) {
    console.error("Failed to save products", e);
  }
}
