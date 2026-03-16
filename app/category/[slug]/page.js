import { redirect } from 'next/navigation';

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  // Capitalize first letter to match category names in DB
  const category = slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
  redirect(`/products?category=${encodeURIComponent(category)}`);
}