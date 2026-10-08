import React from 'react';
import Link from 'next/link';
import { animeProvider } from '@/lib/anime-provider';
import { parseEpisodeSlug, getAnimeTitle, stripHtml, formatRating } from '@/lib/utils';
import VideoPlayer from '@/components/VideoPlayer';
import EpisodePlaylist from './EpisodePlaylist';
import { Star, ChevronRight, Info, Film, Share2 } from 'lucide-react';
import styles from './Watch.module.css';

interface WatchPageProps {
  params: Promise<{ episodeId: string }>;
  searchParams: Promise<{ animeId?: string; ep?: string }>;
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { episodeId } = await params;
  const resolvedSearchParams = await searchParams;

  const { animeId, episode } = parseEpisodeSlug(episodeId, resolvedSearchParams.animeId);
  const currentEpNum = resolvedSearchParams.ep ? parseInt(resolvedSearchParams.ep, 10) : episode;

  try {
    // Fetch anime details first to obtain malId, then episode sources
    const anime = await animeProvider.fetchAnimeInfo(animeId);
    const streamData = await animeProvider.fetchEpisodeSources(
      episodeId,
      animeId,
      currentEpNum,
      anime.malId,
      anime.format
    );

    const title = getAnimeTitle(anime.title);
    const score = formatRating(anime.rating);
    const totalEps = anime.totalEpisodes || anime.episodes?.length || 1;

    const currentEpisodeObj = anime.episodes?.find((e: any) => e.number === currentEpNum) || {
      id: `${animeId}-${currentEpNum}`,
      number: currentEpNum,
      title: `Episode ${currentEpNum}`,
      url: `/watch/${animeId}-${currentEpNum}?animeId=${animeId}&ep=${currentEpNum}`,
    };

    const hasPrev = currentEpNum > 1;
    const hasNext = currentEpNum < totalEps;
    const prevEpUrl = hasPrev
      ? `/watch/${animeId}-${currentEpNum - 1}?animeId=${animeId}&ep=${currentEpNum - 1}`
      : undefined;
    const nextEpUrl = hasNext
      ? `/watch/${animeId}-${currentEpNum + 1}?animeId=${animeId}&ep=${currentEpNum + 1}`
      : undefined;

    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          {/* Breadcrumb Bar */}
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link>
            <ChevronRight size={14} className={styles.breadcrumbSep} />
            <Link href={`/anime/${anime.id}`} className={styles.breadcrumbLink}>{title}</Link>
            <ChevronRight size={14} className={styles.breadcrumbSep} />
            <span className={styles.breadcrumbCurrent}>Episode {currentEpNum}</span>
          </div>

          {/* Main Cinema Grid Layout */}
          <div className={styles.layoutGrid}>
            {/* Left Column: Player & Episode Info */}
            <div className={styles.mainColumn}>
              <div className={styles.playerWrapper}>
                <VideoPlayer
                  servers={streamData.servers}
                  defaultSrc={streamData.servers[0]?.url}
                  poster={anime.cover || anime.image}
                  animeTitle={title}
                  episodeNumber={currentEpNum}
                  subtitles={streamData.subtitles}
                  hasNextEpisode={hasNext}
                  hasPrevEpisode={hasPrev}
                  onNextEpisode={undefined}
                  onPrevEpisode={undefined}
                />
              </div>

              {/* Episode Header & Details Below Player */}
              <div className={styles.episodeDetailCard}>
                <div className={styles.epTitleRow}>
                  <div>
                    <span className={styles.epTag}>Episode {currentEpNum}</span>
                    <h1 className={styles.epHeading}>
                      {currentEpisodeObj.title && currentEpisodeObj.title !== `Episode ${currentEpNum}`
                        ? currentEpisodeObj.title
                        : `${title} - Episode ${currentEpNum}`}
                    </h1>
                  </div>

                  <div className={styles.actionButtons}>
                    <Link href={`/anime/${anime.id}`} className={styles.detailsBtn}>
                      <Info size={16} />
                      <span>Detail Anime</span>
                    </Link>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  {score && (
                    <span className={styles.ratingBadge}>
                      <Star size={13} fill="currentColor" /> {score}
                    </span>
                  )}
                  {anime.format && <span className={styles.badge}>{anime.format}</span>}
                  {anime.releaseDate && <span className={styles.badge}>{anime.releaseDate}</span>}
                  {anime.studio && <span className={styles.badge}>{anime.studio}</span>}
                  <span className={styles.badgeGreen}>Multi-Sub (Indo & Eng)</span>
                </div>

                {/* Synopsis Accordion */}
                <div className={styles.synopsisBox}>
                  <h3 className={styles.synopsisTitle}>Sinopsis:</h3>
                  <p className={styles.synopsisText}>
                    {stripHtml(anime.description) || 'Tidak ada deskripsi tersedia untuk anime ini.'}
                  </p>
                </div>

                {/* Genres */}
                {anime.genres && anime.genres.length > 0 && (
                  <div className={styles.genreList}>
                    {anime.genres.map((g: string) => (
                      <Link key={g} href={`/search?genre=${encodeURIComponent(g)}`} className={styles.genreTag}>
                        {g}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Episode Playlist Sidebar */}
            <div className={styles.sideColumn}>
              <EpisodePlaylist
                episodes={anime.episodes || []}
                currentEpisode={currentEpNum}
                animeId={anime.id}
                animeTitle={title}
              />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading watch page:', error);
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <Film size={48} className={styles.errorIcon} />
          <h2>Gagal memuat video anime</h2>
          <p>Terjadi kendala saat menghubungkan ke server anime. Silakan muat ulang halaman atau pilih anime lain.</p>
          <div className={styles.errorActions}>
            <Link href="/" className={styles.backHomeBtn}>
              Kembali ke Beranda
            </Link>
            <Link href={`/anime/${animeId}`} className={styles.tryOtherBtn}>
              Lihat Detail Anime
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

