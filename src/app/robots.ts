import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/messages/',
          '/chat/',
          '/publish/',
          '/login/',
          '/register/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/messages/',
          '/chat/',
          '/publish/',
          '/login/',
          '/register/',
        ],
      },
    ],
    sitemap: 'https://vindel.ro/api/sitemap',
  };
}
