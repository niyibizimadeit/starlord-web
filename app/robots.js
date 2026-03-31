export async function GET() {
    const base = 'https://starlordgroup.rw';
  
    const content = `User-agent: *
  Allow: /
  Allow: /about
  Allow: /products
  Allow: /products/
  Allow: /category/
  Allow: /sitemap.xml
  Allow: /favicon.ico
  
  Disallow: /admin/
  Disallow: /admin
  Disallow: /api/
  Disallow: /account/
  Disallow: /account
  Disallow: /login/
  Disallow: /register/
  Disallow: /forgot-password/
  Disallow: /checkout/
  Disallow: /cart/
  Disallow: /private/
  
  Sitemap: ${base}/sitemap.xml
  Host: ${base}`;
  
    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, s-maxage=86400',
      },
    });
  }