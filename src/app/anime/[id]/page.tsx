import React from 'react';
import Link from 'next/link';
import { animeProvider } from '@/lib/anime-provider';
import { getAnimeTitle, stripHtml, formatRating, formatDuration } from '@/lib/utils';
import EpisodeBrowser from './EpisodeBrowser';
import TrailerModal from './TrailerModal';
import Carousel from '@/components/Carousel';
import {
  Play,
  Star,
  Calendar,
  Layers,
  Clock,
  Building2,
  Tv,
  ChevronRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import styles from './AnimeDetail.module.css';

interface AnimeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { id } = await params;

  try {
    const anime = await animeProvider.fetchAnimeInfo(id);
    const title = getAnimeTitle(anime.title);
    const score = formatRating(anime.rating);
    const duration = formatDuration(anime.duration);
    const firstEpId = anime.episodes?.[0]?.id || `${anime.id}-1`;
    const firstEpUrl = `/watch/${firstEpId}?animeId=${anime.id}&ep=1`;

    return (
      <div className={styles.detailWrapper}>
        {/* Cinematic Backdrop Hero */}
        <div className={styles.heroSection}>
          {anime.cover && (
            <img
              src={anime.cover}
              alt={title}
              className={styles.backdropImage}
            />
          )}
          <div className={styles.backdropOverlay} />

          <div className={styles.heroContainer}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              <Link href="/" className={styles.breadcrumbLink}>Home</Link>
              <ChevronRight size={14} />
              <Link href="/search" className={styles.breadcrumbLink}>Browse</Link>
              <ChevronRight size={14} />
              <span className={styles.breadcrumbActive}>{title}</span>
            </div>

            <div className={styles.heroContentGrid}>
              {/* Poster Column */}
              <div className={styles.posterColumn}>
                <div className={styles.posterWrapper}>
                  <img src={anime.image} alt={title} className={styles.posterImg} />
                  {score && (
                    <div className={styles.scoreBadgeFloat}>
                      <Star size={14} fill="currentColor" />
                      <span>{score}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Column */}
              <div className={styles.infoColumn}>
                {anime.title?.native && (
                  <span className={styles.nativeTitle}>{anime.title.native}</span>
                )}
                <h1 className={styles.mainTitle}>{title}</h1>

                {/* Badges Bar */}
                <div className={styles.badgeBar}>
                  {score && (
                    <span className={styles.starBadge}>
                      <Star size={14} fill="currentColor" /> {score} / 10
                    </span>
                  )}
                  {anime.format && (
                    <span className={styles.metaBadge}>
                      <Tv size={12} /> {anime.format}
                    </span>
                  )}
                  {anime.totalEpisodes && (
                    <span className={styles.metaBadge}>
                      <Layers size={12} /> {anime.totalEpisodes} Eps
                    </span>
                  )}
                  {anime.releaseDate && (
                    <span className={styles.metaBadge}>
                      <Calendar size={12} /> {anime.releaseDate}
                    </span>
                  )}
                  {duration && (
                    <span className={styles.metaBadge}>
                      <Clock size={12} /> {duration}
                    </span>
                  )}
                  {anime.status && (
                    <span className={`${styles.metaBadge} ${styles.statusBadge}`}>
                      {anime.status}
                    </span>
                  )}
                </div>

                {/* Genre Tags */}
                {anime.genres && anime.genres.length > 0 && (
                  <div className={styles.genreTags}>
                    {anime.genres.map((genre: string) => (
                      <Link
                        key={genre}
                        href={`/search?genre=${encodeURIComponent(genre)}`}
                        className={styles.genrePill}
                      >
                        {genre}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.actionRow}>
                  {anime.episodes && anime.episodes.length > 0 && (
                    <Link href={firstEpUrl} className={styles.watchNowBtn} prefetch={false}>
                      <Play size={20} fill="currentColor" />
                      <span>Tonton Episode 1</span>
                    </Link>
                  )}

                  {anime.trailer && (
                    <TrailerModal
                      trailerId={anime.trailer.id}
                      trailerSite={anime.trailer.site}
                      animeTitle={title}
                    />
                  )}
                </div>

                {/* Synopsis */}
                <div className={styles.synopsisArea}>
                  <h3 className={styles.synopsisHeader}>Sinopsis:</h3>
                  <p className={styles.synopsisParagraph}>
                    {stripHtml(anime.description) || 'Deskripsi belum tersedia untuk anime ini.'}
                  </p>
                </div>

                {/* Studio / Production info */}
                {anime.studio && (
                  <div className={styles.studioInfo}>
                    <Building2 size={15} />
                    <span>Studio: <strong>{anime.studio}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Sections: Episodes, Characters & Recommendations */}
        <div className={styles.bodyContainer}>
          {/* Episode Browser */}
          <section className={styles.episodesSection}>
            <EpisodeBrowser episodes={anime.episodes || []} animeId={anime.id} />
          </section>

          {/* Characters Section (if available) */}
          {anime.characters && anime.characters.length > 0 && (
            <section className={styles.charactersSection}>
              <h2 className={styles.sectionHeading}>Karakter Anime</h2>
              <div className={styles.characterGrid}>
                {anime.characters.map((char: any) => (
                  <div key={char.id} className={styles.charCard}>
                    <div className={styles.charThumbWrapper}>
                      {char.image ? (
                        <img src={char.image} alt={char.name} className={styles.charThumb} loading="lazy" />
                      ) : (
                        <div className={styles.charThumbPlaceholder} />
                      )}
                    </div>
                    <span className={styles.charName}>{char.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related / Recommendations Carousel */}
          {anime.recommendations && anime.recommendations.length > 0 && (
            <section className={styles.recSection}>
              <Carousel
                title="Rekomendasi Anime Serupa"
                items={anime.recommendations}
                icon={<Sparkles size={20} className="text-accent-primary" />}
              />
            </section>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in AnimeDetailPage:', error);
    return (
      <div className={styles.errorWrapper}>
        <div className={styles.errorBox}>
          <h2>Gagal memuat detail anime</h2>
          <p>Anime dengan ID {id} tidak ditemukan atau server sedang mengalami gangguan jaringan.</p>
          <div className={styles.errorActions}>
            <Link href="/" className={styles.backHomeBtn}>
              <ArrowLeft size={16} />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

