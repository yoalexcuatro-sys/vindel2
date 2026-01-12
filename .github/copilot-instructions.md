# Vindel.ro - Marketplace Clone

## Project Overview
A professional marketplace application built with Next.js 16, TypeScript, Tailwind CSS, and Firebase.

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Icons**: Lucide React

## Firebase Services

### Authentication (`src/lib/auth-context.tsx`)
- Email/password authentication
- Google OAuth sign-in
- User profile management in Firestore
- Protected routes with ProtectedRoute component

### Firestore Database (`src/lib/products-service.ts`, `src/lib/messages-service.ts`)
- Products collection with full CRUD operations
- User profiles in users collection
- Real-time messaging with conversations and messages collections
- Pagination and filtering support

### Storage (`src/lib/storage-service.ts`)
- Product image uploads with compression
- User avatar uploads
- Organized by products/{id} and avatars/{userId}

## Project Structure
```
src/
├── app/           # Next.js App Router pages
│   ├── login/     # Login page with Firebase Auth
│   ├── register/  # Registration with account types
│   ├── profile/   # Protected user dashboard
│   ├── publish/   # Product creation form
│   ├── product/   # Product detail pages
│   ├── search/    # Search results
│   └── messages/  # Chat functionality
├── components/    # Reusable UI components
├── lib/           # Firebase config and services
└── data/          # Type definitions and local data
```

## Environment Variables
Copy `.env.local.example` to `.env.local` and configure:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Key Features
- ✅ User authentication (email + Google)
- ✅ Product listing and management
- ✅ Image upload with compression
- ✅ Real-time messaging
- ✅ Search and filtering
- ✅ Responsive design
- ✅ Business and personal account types
