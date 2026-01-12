# Vindel - Marketplace Clone

Este es un proyecto de marketplace profesional inspirado en Wallapop, construido con Next.js, Tailwind CSS, TypeScript y Firebase.

## Características

- **Diseño Profesional**: Interfaz limpia y moderna similar a las aplicaciones líderes de compraventa.
- **Responsive**: Totalmente adaptado a móviles y escritorio.
- **Autenticación**: Login/registro con email y Google usando Firebase Auth.
- **Base de datos**: Firestore para productos, usuarios y mensajes.
- **Storage**: Firebase Storage para imágenes de productos y avatares.
- **Mensajería en tiempo real**: Chat entre compradores y vendedores.
- **Componentes**:
  - Barra de navegación con búsqueda y categorías.
  - Grid de productos destacados.
  - Tarjetas de producto con detalles y estado.
  - Footer completo con enlaces de ayuda y legal.
  - Panel de usuario con gestión de anuncios.

## Tecnologías

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage)
- [Lucide React](https://lucide.dev/) (para los iconos)

## Configuración de Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)

2. Habilitar los servicios:
   - **Authentication**: Email/Password y Google Sign-In
   - **Firestore Database**: Crear base de datos en modo producción
   - **Storage**: Crear bucket de almacenamiento

3. Copiar las credenciales del proyecto (Project Settings > General > Your apps)

4. Crear archivo `.env.local` basándote en `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```

5. Rellenar las variables de entorno con tus credenciales:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
   ```

## Reglas de Firestore

Añadir estas reglas en Firebase Console > Firestore > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.sellerId == request.auth.uid;
    }
    
    // Conversations collection
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## Reglas de Storage

Añadir estas reglas en Firebase Console > Storage > Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Cómo empezar

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar Firebase (ver sección anterior)

3. Ejecutar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.
