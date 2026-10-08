'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Play, Search, ListFilter, Volume2 } from 'lucide-react';
import styles from './Watch.module.css';

interface Episode {
  id: string;
  number: number;
  title: string;
  image?: string;
  url: string;
}

interface EpisodePlaylistProps {
  episodes: Episode[];
  currentEpisode: number;
  animeId: string;
  animeTitle: string;
}

const EPISODES_PER_CHUNK = 50;

export default function EpisodePlaylist({
  episodes,
  currentEpisode,
  animeId,
  animeTitle,
}: EpisodePlaylistProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Calculate which chunk the current episode is in
  const initialChunk = Math.floor((currentEpisode - 1) / EPISODES_PER_CHUNK);
  const [selectedChunk, setSelectedChunk] = useState(Math.max(0, initialChunk));

  const totalChunks = Math.ceil(episodes.length / EPISODES_PER_CHUNK);
  const activeEpisodeRef = useRef<HTMLAnchorElement>(null);

  // Auto-scroll active episode into view on load
  useEffect(() => {
    if (activeEpisodeRef.current) {
      activeEpisodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentEpisode, selectedChunk]);

  // Filter episodes based on chunk and search
  const visibleEpisodes = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return episodes.filter(
        (ep) =>
          ep.number.toString().includes(q) ||
          ep.title.toLowerCase().includes(q)
      );
    }

    const start = selectedChunk * EPISODES_PER_CHUNK;
    const end = start + EPISODES_PER_CHUNK;
    return episodes.slice(start, end);
  }, [episodes, selectedChunk, searchQuery]);

  return (
    <div className={styles.playlistCard}>
      <div className={styles.playlistHeader}>
        <div className={styles.playlistTitleGroup}>
          <h3 className={styles.playlistTitle}>Daftar Episode</h3>
          <span className={styles.totalBadge}>{episodes.length} Eps</span>
        </div>

        {/* Quick Search inside episodes */}
        <div className={styles.searchEpisodeWrapper}>
          <Search size={14} className={styles.searchEpIcon} />
          <input
            type="text"
            placeholder="Cari nomor/judul episode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchEpInput}
          />
        </div>
      </div>

      {/* Episode Chunk Range Tabs (if total > 50) */}
      {!searchQuery && totalChunks > 1 && (
        <div className={styles.chunkTabs}>
          {Array.from({ length: totalChunks }, (_, idx) => {
            const startEp = idx * EPISODES_PER_CHUNK + 1;
            const endEp = Math.min((idx + 1) * EPISODES_PER_CHUNK, episodes.length);
            return (
              <button
                key={idx}
                type="button"
                className={`${styles.chunkBtn} ${selectedChunk === idx ? styles.activeChunk : ''}`}
                onClick={() => setSelectedChunk(idx)}
              >
                {startEp} - {endEp}
              </button>
            );
          })}
        </div>
      )}

      {/* Episode List */}
      <div className={styles.episodeListScroll}>
        {visibleEpisodes.length === 0 ? (
          <div className={styles.noEpisodes}>
            <p>Episode tidak ditemukan.</p>
          </div>
        ) : (
          visibleEpisodes.map((ep) => {
            const isActive = ep.number === currentEpisode;
            return (
              <Link
                key={ep.id}
                ref={isActive ? activeEpisodeRef : null}
                href={`/watch/${animeId}-${ep.number}?animeId=${animeId}&ep=${ep.number}`}
                className={`${styles.epItem} ${isActive ? styles.epItemActive : ''}`}
                prefetch={false}
              >
                <div className={styles.epThumbWrapper}>
                  {ep.image ? (
                    <img src={ep.image} alt={ep.title} className={styles.epThumb} loading="lazy" />
                  ) : (
                    <div className={styles.epThumbPlaceholder}>
                      <Play size={14} />
                    </div>
                  )}
                  {isActive ? (
                    <div className={styles.playingIndicator}>
                      <Volume2 size={12} className={styles.equalizerIcon} />
                    </div>
                  ) : (
                    <div className={styles.epHoverPlay}>
                      <Play size={14} fill="white" />
                    </div>
                  )}
                </div>

                <div className={styles.epMeta}>
                  <div className={styles.epHeaderLine}>
                    <span className={styles.epNumberText}>Episode {ep.number}</span>
                    {isActive && <span className={styles.nowPlayingBadge}>Sedang Diputar</span>}
                  </div>
                  <h4 className={styles.epTitleText}>{ep.title}</h4>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
