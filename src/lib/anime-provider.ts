// Server-only: never import this in Client Components

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

// Simple in-memory cache to prevent redundant network calls and rate limits
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes cache

async function fetchGraphQL(query: string, variables: Record<string, any> = {}) {
  const cacheKey = JSON.stringify({ query, variables });
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Artheanime/1.0',
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`AniList GraphQL request failed with HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message || 'GraphQL error');
    }

    const data = json.data;
    cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS });
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

interface AniZipMappings {
  themoviedb_id?: string | number | null;
  imdb_id?: string | null;
  mal_id?: number | null;
  type?: string | null;
}

interface AniZipEpisodeInfo {
  seasonNumber?: number;
  episodeNumber?: number;
  absoluteEpisodeNumber?: number;
}

interface AniZipResult {
  mappings: AniZipMappings | null;
  episodes: Record<string, AniZipEpisodeInfo> | null;
}

const aniZipCache = new Map<number, AniZipResult & { expiry: number }>();

async function fetchAniZipData(anilistId: number): Promise<AniZipResult> {
  const cached = aniZipCache.get(anilistId);
  if (cached && cached.expiry > Date.now()) {
    return { mappings: cached.mappings, episodes: cached.episodes };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(`https://api.ani.zip/mappings?anilist_id=${anilistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Artheanime/1.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      aniZipCache.set(anilistId, { mappings: null, episodes: null, expiry: Date.now() + 1000 * 60 * 5 });
      return { mappings: null, episodes: null };
    }

    const json = await res.json();
    const result: AniZipResult = {
      mappings: json.mappings || null,
      episodes: json.episodes || null,
    };
    aniZipCache.set(anilistId, { ...result, expiry: Date.now() + 1000 * 60 * 60 * 24 });
    return result;
  } catch {
    clearTimeout(timeoutId);
    return { mappings: null, episodes: null };
  }
}

function mapMediaItem(media: any) {
  if (!media) return null;
  return {
    id: media.id.toString(),
    malId: media.idMal,
    title: {
      romaji: media.title?.romaji || '',
      english: media.title?.english || media.title?.romaji || '',
      native: media.title?.native || '',
      userPreferred: media.title?.userPreferred || media.title?.english || media.title?.romaji || '',
    },
    image: media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium || '',
    cover: media.bannerImage || media.coverImage?.extraLarge || media.coverImage?.large || '',
    color: media.coverImage?.color || '#e50914',
    description: media.description || '',
    status: media.status || 'UNKNOWN',
    releaseDate: media.seasonYear || (media.startDate?.year ? media.startDate.year : undefined),
    totalEpisodes: media.episodes || undefined,
    duration: media.duration || undefined,
    genres: media.genres || [],
    rating: media.averageScore || undefined,
    type: media.format || 'TV',
  };
}

export const animeProvider = {
  /**
   * Fetch trending anime for hero and carousel
   */
  async fetchTrendingAnime(page = 1, perPage = 20) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            currentPage
            hasNextPage
            total
          }
          media(sort: [TRENDING_DESC, POPULARITY_DESC], type: ANIME) {
            id
            idMal
            title { romaji english native userPreferred }
            coverImage { extraLarge large medium color }
            bannerImage
            description
            status
            episodes
            duration
            season
            seasonYear
            genres
            averageScore
            format
          }
        }
      }
    `;

    try {
      const data = await fetchGraphQL(query, { page, perPage });
      const mediaList = data.Page?.media || [];
      return {
        currentPage: data.Page?.pageInfo?.currentPage || 1,
        hasNextPage: data.Page?.pageInfo?.hasNextPage || false,
        results: mediaList.map(mapMediaItem).filter(Boolean),
      };
    } catch (error) {
      console.error('Error in fetchTrendingAnime:', error);
      return { currentPage: 1, hasNextPage: false, results: [] };
    }
  },

  /**
   * Fetch popular anime
   */
  async fetchPopularAnime(page = 1, perPage = 20) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            currentPage
            hasNextPage
            total
          }
          media(sort: [POPULARITY_DESC], type: ANIME) {
            id
            idMal
            title { romaji english native userPreferred }
            coverImage { extraLarge large medium color }
            bannerImage
            description
            status
            episodes
            duration
            season
            seasonYear
            genres
            averageScore
            format
          }
        }
      }
    `;

    try {
      const data = await fetchGraphQL(query, { page, perPage });
      const mediaList = data.Page?.media || [];
      return {
        currentPage: data.Page?.pageInfo?.currentPage || 1,
        hasNextPage: data.Page?.pageInfo?.hasNextPage || false,
        results: mediaList.map(mapMediaItem).filter(Boolean),
      };
    } catch (error) {
      console.error('Error in fetchPopularAnime:', error);
      return { currentPage: 1, hasNextPage: false, results: [] };
    }
  },

  /**
   * Search anime by keyword, genre, format
   */
  async search(queryStr: string, page = 1, perPage = 20, genre?: string, format?: string) {
    const query = `
      query ($search: String, $page: Int, $perPage: Int, $genre: String, $format: MediaFormat) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            currentPage
            hasNextPage
            total
          }
          media(search: $search, genre: $genre, format: $format, sort: [SEARCH_MATCH, POPULARITY_DESC], type: ANIME) {
            id
            idMal
            title { romaji english native userPreferred }
            coverImage { extraLarge large medium color }
            bannerImage
            description
            status
            episodes
            duration
            seasonYear
            genres
            averageScore
            format
          }
        }
      }
    `;

    const variables: any = { page, perPage };
    if (queryStr && queryStr.trim()) {
      variables.search = queryStr.trim();
    }
    if (genre && genre.trim() && genre !== 'All') {
      variables.genre = genre.trim();
    }
    if (format && format.trim() && format !== 'All') {
      variables.format = format.trim().toUpperCase();
    }

    try {
      const data = await fetchGraphQL(query, variables);
      const mediaList = data.Page?.media || [];
      return {
        currentPage: data.Page?.pageInfo?.currentPage || 1,
        hasNextPage: data.Page?.pageInfo?.hasNextPage || false,
        total: data.Page?.pageInfo?.total || 0,
        results: mediaList.map(mapMediaItem).filter(Boolean),
      };
    } catch (error) {
      console.error('Error in search:', error);
      return { currentPage: 1, hasNextPage: false, total: 0, results: [] };
    }
  },

  /**
   * Fetch full anime details + generate accurate episode list
   */
  async fetchAnimeInfo(id: string | number) {
    const anilistId = parseInt(id.toString(), 10);
    if (isNaN(anilistId)) {
      throw new Error(`Invalid anime ID: ${id}`);
    }

    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          idMal
          title { romaji english native userPreferred }
          description(asHtml: false)
          status
          season
          seasonYear
          episodes
          duration
          format
          genres
          averageScore
          popularity
          studios(isMain: true) {
            nodes { name }
          }
          coverImage { extraLarge large medium color }
          bannerImage
          nextAiringEpisode { episode airingAt }
          streamingEpisodes { title thumbnail url site }
          trailer { id site thumbnail }
          characters(sort: [ROLE, RELEVANCE], perPage: 8) {
            nodes {
              id
              name { full userPreferred }
              image { large medium }
            }
          }
          recommendations(perPage: 12, sort: [RATING_DESC]) {
            nodes {
              mediaRecommendation {
                id
                title { romaji english userPreferred }
                coverImage { extraLarge large medium }
                averageScore
                format
                episodes
              }
            }
          }
        }
      }
    `;

    const data = await fetchGraphQL(query, { id: anilistId });
    const media = data.Media;
    if (!media) {
      throw new Error(`Anime not found with ID ${id}`);
    }

    // Determine total episodes
    let episodeCount = media.episodes;
    if (!episodeCount && media.nextAiringEpisode) {
      episodeCount = media.nextAiringEpisode.episode - 1;
    }
    if (!episodeCount || episodeCount < 1) {
      episodeCount = media.format === 'MOVIE' ? 1 : 12;
    }

    // Map streaming episode titles and thumbnails if available from Crunchyroll / AniList
    const streamingMap = new Map<number, { title: string; thumbnail?: string }>();
    if (Array.isArray(media.streamingEpisodes)) {
      media.streamingEpisodes.forEach((s: any) => {
        const match = s.title?.match(/Episode\s+(\d+)/i);
        if (match) {
          const epNum = parseInt(match[1], 10);
          streamingMap.set(epNum, {
            title: s.title,
            thumbnail: s.thumbnail,
          });
        }
      });
    }

    const episodes = Array.from({ length: Math.min(episodeCount, 1500) }, (_, i) => {
      const epNum = i + 1;
      const streamInfo = streamingMap.get(epNum);
      return {
        id: `${media.id}-${epNum}`,
        number: epNum,
        title: streamInfo?.title || `Episode ${epNum}`,
        image: streamInfo?.thumbnail || media.coverImage?.large || media.bannerImage,
        url: `/watch/${media.id}-${epNum}?animeId=${media.id}&ep=${epNum}`,
      };
    });

    const recommendations = (media.recommendations?.nodes || [])
      .map((node: any) => node.mediaRecommendation)
      .filter((rec: any) => rec && rec.id)
      .map(mapMediaItem);

    const characters = (media.characters?.nodes || []).map((char: any) => ({
      id: char.id,
      name: char.name?.userPreferred || char.name?.full || '',
      image: char.image?.large || char.image?.medium || '',
    }));

    return {
      id: media.id.toString(),
      malId: media.idMal,
      title: {
        romaji: media.title?.romaji || '',
        english: media.title?.english || media.title?.romaji || '',
        native: media.title?.native || '',
        userPreferred: media.title?.userPreferred || media.title?.english || '',
      },
      description: media.description || '',
      status: media.status || 'UNKNOWN',
      releaseDate: media.seasonYear ? `${media.seasonYear}` : undefined,
      totalEpisodes: episodeCount,
      duration: media.duration,
      format: media.format || 'TV',
      genres: media.genres || [],
      rating: media.averageScore,
      popularity: media.popularity,
      studio: media.studios?.nodes?.[0]?.name || 'Unknown Studio',
      cover: media.bannerImage || media.coverImage?.extraLarge,
      image: media.coverImage?.extraLarge || media.coverImage?.large,
      color: media.coverImage?.color || '#e50914',
      trailer: media.trailer?.site === 'youtube' && media.trailer?.id ? media.trailer : null,
      episodes,
      recommendations,
      characters,
    };
  },

  /**
   * Resilient Multi-Server Episode Streams & Subtitles
   * Resolves MyAnimeList (MAL) ID from AniList ID to provide fully functional streaming servers.
   */
  async fetchEpisodeSources(
    episodeId: string,
    animeIdQuery?: string | null,
    epQuery?: number | null,
    malIdQuery?: number | null,
    formatQuery?: string | null
  ) {
    // Parse animeId & episode number
    let animeId = animeIdQuery || '';
    let episodeNum = epQuery || 1;

    if (!animeId || !episodeNum) {
      const match = episodeId.match(/^(\d+)-(?:ep-?)?(\d+)$/i);
      if (match) {
        animeId = match[1];
        episodeNum = parseInt(match[2], 10);
      } else {
        const epMatch = episodeId.match(/episode-(\d+)/i);
        if (epMatch) {
          episodeNum = parseInt(epMatch[1], 10);
        }
        const idMatch = episodeId.match(/(\d+)/);
        if (idMatch) {
          animeId = idMatch[1];
        }
      }
    }

    if (!animeId) {
      animeId = '21'; // Fallback to One Piece
    }

    const anilistId = parseInt(animeId, 10);

    // Fetch mappings (TMDB, IMDb, MAL) and accurate season/episode from ani.zip
    const aniZip = !isNaN(anilistId) ? await fetchAniZipData(anilistId) : { mappings: null, episodes: null };
    const mappings = aniZip.mappings;
    const epData = aniZip.episodes?.[episodeNum.toString()];

    // Accurately map season & episode number (e.g. JJK Season 2 Ep 1 -> Season 2, Episode 1)
    const seasonNumber = epData?.seasonNumber || 1;
    const resolvedEpNumber = epData?.episodeNumber || episodeNum;

    const tmdbId = mappings?.themoviedb_id;
    const imdbId = mappings?.imdb_id;

    // Resolve MyAnimeList (MAL) ID if not provided
    let targetMalId = malIdQuery || (mappings?.mal_id ? parseInt(mappings.mal_id.toString(), 10) : null);
    if (!targetMalId) {
      if (!isNaN(anilistId)) {
        try {
          const query = `
            query ($id: Int) {
              Media(id: $id, type: ANIME) {
                id
                idMal
                format
              }
            }
          `;
          const data = await fetchGraphQL(query, { id: anilistId });
          targetMalId = data?.Media?.idMal || anilistId;
          if (!formatQuery && data?.Media?.format) {
            formatQuery = data.Media.format;
          }
        } catch {
          targetMalId = anilistId;
        }
      } else {
        targetMalId = 21;
      }
    }

    const isMovie =
      formatQuery?.toUpperCase() === 'MOVIE' ||
      mappings?.type?.toUpperCase() === 'MOVIE';

    // Verified reliable multi-server options for anime streaming
    const servers: {
      server: string;
      name: string;
      type: 'embed' | 'hls';
      url: string;
      isDefault?: boolean;
    }[] = [];

    // Server 1 - Videasy HD (Paling Bersih, Cepat & Bebas Judol)
    if (isMovie) {
      servers.push({
        server: 'videasy',
        name: 'Server 1 - Videasy HD (Super Bersih & Cepat)',
        type: 'embed',
        url: `https://player.videasy.to/movie/${tmdbId || targetMalId}`,
        isDefault: true,
      });
    } else {
      servers.push({
        server: 'videasy',
        name: 'Server 1 - Videasy HD (Super Bersih & Cepat)',
        type: 'embed',
        url: `https://player.videasy.to/tv/${tmdbId || targetMalId}/${seasonNumber}/${resolvedEpNumber}`,
        isDefault: true,
      });
    }

    // Server 2 - VidSrc HD (Auto Sub Indo & Eng)
    if (isMovie) {
      servers.push({
        server: 'vidsrc-to',
        name: 'Server 2 - VidSrc HD (Auto Sub Indo & Eng)',
        type: 'embed',
        url: `https://vidsrc.to/embed/movie/${tmdbId || targetMalId}`,
        isDefault: false,
      });
    } else {
      servers.push({
        server: 'vidsrc-to',
        name: 'Server 2 - VidSrc HD (Auto Sub Indo & Eng)',
        type: 'embed',
        url: `https://vidsrc.to/embed/tv/${tmdbId || targetMalId}/${seasonNumber}/${resolvedEpNumber}`,
        isDefault: false,
      });
    }

    // Server 3 - MultiEmbed (Multi-Stream Mirrors)
    if (isMovie) {
      const vidId = tmdbId || imdbId || targetMalId;
      const param = tmdbId ? '&tmdb=1' : imdbId ? '' : '&mal=1';
      servers.push({
        server: 'multiembed',
        name: 'Server 3 - MultiEmbed (Mirror Multi-Stream)',
        type: 'embed',
        url: `https://multiembed.mov/?video_id=${vidId}${param}`,
        isDefault: false,
      });
    } else {
      const vidId = tmdbId || targetMalId;
      const param = tmdbId ? '&tmdb=1' : '&mal=1';
      servers.push({
        server: 'multiembed',
        name: 'Server 3 - MultiEmbed (Mirror Multi-Stream)',
        type: 'embed',
        url: `https://multiembed.mov/?video_id=${vidId}${param}&s=${seasonNumber}&e=${resolvedEpNumber}`,
        isDefault: false,
      });
    }

    // Server 4 - 2Embed (Cadangan Terlengkap)
    if (isMovie) {
      servers.push({
        server: '2embed',
        name: 'Server 4 - 2Embed (Cadangan Global)',
        type: 'embed',
        url: `https://www.2embed.cc/embed/${tmdbId || imdbId || targetMalId}`,
        isDefault: false,
      });
    } else {
      servers.push({
        server: '2embed',
        name: 'Server 4 - 2Embed (Cadangan Global)',
        type: 'embed',
        url: `https://www.2embed.cc/embedtv/${tmdbId || imdbId || targetMalId}&s=${seasonNumber}&e=${resolvedEpNumber}`,
        isDefault: false,
      });
    }

    // Server 5 - VidSrc V2 (Mirror Cepat & Stabil)
    if (isMovie) {
      servers.push({
        server: 'vidsrc-sh',
        name: 'Server 5 - VidSrc V2 (Mirror Cepat)',
        type: 'embed',
        url: `https://vidsrc.sh/embed/movie?tmdb=${tmdbId || targetMalId}`,
        isDefault: false,
      });
    } else {
      servers.push({
        server: 'vidsrc-sh',
        name: 'Server 5 - VidSrc V2 (Mirror Cepat)',
        type: 'embed',
        url: `https://vidsrc.sh/embed/tv?tmdb=${tmdbId || targetMalId}&season=${seasonNumber}&episode=${resolvedEpNumber}`,
        isDefault: false,
      });
    }

    // Supported multi-language subtitles
    const subtitles = [
      { lang: 'Indonesian', label: 'Bahasa Indonesia', isDefault: true },
      { lang: 'English', label: 'English', isDefault: false },
      { lang: 'Japanese', label: '日本語 (Japanese)', isDefault: false },
      { lang: 'Spanish', label: 'Español', isDefault: false },
    ];

    return {
      animeId,
      malId: targetMalId,
      tmdbId,
      imdbId,
      isMovie,
      episode: episodeNum,
      servers,
      subtitles,
      // For backwards compatibility with consumers expecting sources array
      sources: servers.map((s) => ({
        quality: s.isDefault ? 'default' : s.server,
        url: s.url,
        isM3U8: false,
      })),
    };
  },
};

