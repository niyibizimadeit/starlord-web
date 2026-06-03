export default function robots() {
    const base = 'https://starlordgroup.rw';

    return {
      rules: [
        {
          userAgent: '*',
          allow: ['/', '/about', '/products', '/products/', '/category/'],
          disallow: ['/admin', '/account', '/login', '/register', '/forgot-password', '/checkout', '/cart', '/private/'],
        },
      ],
      sitemap: `${base}/sitemap.xml`,
      host: base,
    };
  }