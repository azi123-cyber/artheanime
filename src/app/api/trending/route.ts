import { NextResponse } from 'next/server';
import { animeProvider } from '@/lib/anime-provider';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';

  try {
    const data = await animeProvider.fetchTrendingAnime(Number(page));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching trending anime:', error);
    return NextResponse.json({ error: 'Failed to fetch trending anime' }, { status: 500 });
  }
}
