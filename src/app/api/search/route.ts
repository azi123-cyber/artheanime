import { NextResponse } from 'next/server';
import { animeProvider } from '@/lib/anime-provider';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  const format = searchParams.get('format') || '';
  const page = searchParams.get('page') || '1';
  const perPage = searchParams.get('perPage') || '20';

  try {
    if (!query && !genre && !format) {
      // If no query/filters, return popular anime as default suggestions
      const data = await animeProvider.fetchPopularAnime(Number(page), Number(perPage));
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    const data = await animeProvider.search(query, Number(page), Number(perPage), genre, format);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error(`Error searching:`, error);
    return NextResponse.json({ error: 'Failed to search anime', results: [] }, { status: 500 });
  }
}

