export type AccountType = 'personal' | 'business';

export interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  location: string;
  joined: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  bio: string;
  accountType: AccountType;
  // Business specific fields
  businessName?: string;
  cui?: string;
  stats: {
    selling: number;
    sold: number;
    favorites: number;
    views?: number;
    revenue?: number;
  };
}

export const currentUser: UserData = {
  id: 101,
  name: 'Alexandru Ionescu',
  email: 'alex@exemplu.ro',
  phone: '0722 123 456',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  location: 'București',
  joined: '2024',
  rating: 4.8,
  reviewsCount: 127,
  verified: true,
  bio: 'Vânzător de încredere cu experiență de peste 5 ani.',
  accountType: 'personal',
  stats: {
    selling: 8,
    sold: 24,
    favorites: 12
  }
};
