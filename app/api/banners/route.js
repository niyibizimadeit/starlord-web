import { getBanners } from '@/lib/banners';

export async function GET() {
  const banners = await getBanners();
  return Response.json({ banners });
}
