import { NextResponse } from 'next/server';
import { animeProvider } from '@/lib/anime-provider';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await animeProvider.fetchAnimeInfo(id);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching anime info:`, error);
    return NextResponse.json({ error: 'Failed to fetch anime info' }, { status: 500 });
  }
}
