/**
 * Client-safe utility functions.
 * DO NOT import @consumet/extensions here — this file is used by Client Components.
 */

export const getAnimeTitle = (title: any): string => {
  if (typeof title === 'string') return title;
  if (title && typeof title === 'object') {
    return title.english || title.romaji || title.userPreferred || title.native || 'Unknown Title';
  }
  return 'Unknown Title';
};

export const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'").trim();
};

export const formatRating = (score?: number | null): string | null => {
  if (!score && score !== 0) return null;
  return (score / 10).toFixed(1);
};

export const formatDuration = (minutes?: number | null): string => {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
};

/**
 * Parses episode ID slug or extracts animeId & episodeNumber.
 * Examples:
 * - "21-1" -> { animeId: "21", episode: 1 }
 * - "21-ep-1" -> { animeId: "21", episode: 1 }
 * - "daemons-195600$episode$2" -> { animeId: "195600", episode: 2 }
 * - "one-piece-episode-1050" -> { animeId: "21", episode: 1050 }
 */
export const parseEpisodeSlug = (slug: string, fallbackAnimeId?: string | null): { animeId: string; episode: number } => {
  if (!slug) {
    return { animeId: fallbackAnimeId || '21', episode: 1 };
  }

  // Format 1: "21-1" or "21-ep-1"
  const simpleMatch = slug.match(/^(\d+)-(?:ep-?)?(\d+)$/i);
  if (simpleMatch) {
    return { animeId: simpleMatch[1], episode: parseInt(simpleMatch[2], 10) };
  }

  // Format 2: "...$episode$N"
  const dollarMatch = slug.match(/(?:-(\d+))?\$episode\$(\d+)/i);
  if (dollarMatch) {
    return { animeId: dollarMatch[1] || fallbackAnimeId || '21', episode: parseInt(dollarMatch[2], 10) };
  }

  // Format 3: "animeName-episode-N"
  const epMatch = slug.match(/episode-(\d+)/i);
  if (epMatch) {
    const num = parseInt(epMatch[1], 10);
    const idMatch = slug.match(/(\d+)(?:-episode|\b)/);
    return { animeId: fallbackAnimeId || idMatch?.[1] || '21', episode: num };
  }

  // Fallback: If slug is just a number
  if (/^\d+$/.test(slug)) {
    return { animeId: fallbackAnimeId || slug, episode: 1 };
  }

  return { animeId: fallbackAnimeId || '21', episode: 1 };
};
