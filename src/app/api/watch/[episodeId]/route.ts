import { NextResponse } from 'next/server';
import { animeProvider } from '@/lib/anime-provider';

export async function GET(request: Request, { params }: { params: Promise<{ episodeId: string }> }) {
  try {
    const { episodeId } = await params;
    const { searchParams } = new URL(request.url);
    const animeId = searchParams.get('animeId');
    const ep = searchParams.get('ep') ? parseInt(searchParams.get('ep')!, 10) : null;
    const malId = searchParams.get('malId') ? parseInt(searchParams.get('malId')!, 10) : null;
    const format = searchParams.get('format');

    const data = await animeProvider.fetchEpisodeSources(episodeId, animeId, ep, malId, format);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching streaming links:`, error);
    return NextResponse.json({ error: 'Failed to fetch streaming links' }, { status: 500 });
  }
}
