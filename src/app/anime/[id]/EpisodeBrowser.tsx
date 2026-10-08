'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Play, Search, Film } from 'lucide-react';
import styles from './AnimeDetail.module.css';

interface Episode {
  id: string;
  number: number;
  title: string;
  image?: string;
  url: string;
}

interface EpisodeBrowserProps {
  episodes: Episode[];
  animeId: string;
}

const CHUNK_SIZE = 50;

export default function EpisodeBrowser({ episodes, animeId }: EpisodeBrowserProps) {
  const [search, setSearch] = useState('');
  const [selectedChunk, setSelectedChunk] = useState(0);

  const totalChunks = Math.ceil(episodes.length / CHUNK_SIZE);

  const filteredEpisodes = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return episodes.filter(
        (ep) => ep.number.toString().includes(q) || ep.title.toLowerCase().includes(q)
      );
    }
    const start = selectedChunk * CHUNK_SIZE;
    return episodes.slice(start, start + CHUNK_SIZE);
  }, [episodes, search, selectedChunk]);

  if (!episodes || episodes.length === 0) {
    return (
      <div className={styles.noEpisodesBox}>
        <Film size={32} />
        <p>Belum ada daftar episode yang tersedia untuk anime ini.</p>
      </div>
    );
  }

  return (
    <div className={styles.episodeBrowserContainer}>
      <div className={styles.browserHeader}>
        <div className={styles.browserTitleGroup}>
          <h2 className={styles.sectionHeading}>Daftar Episode</h2>
          <span className={styles.badgeCount}>{episodes.length} Episode</span>
        </div>

        <div className={styles.browserSearchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari episode (nomor atau judul)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.browserSearchInput}
          />
        </div>
      </div>

      {/* Range Chunk Tabs for large anime */}
      {!search && totalChunks > 1 && (
        <div className={styles.chunkTabList}>
          {Array.from({ length: totalChunks }, (_, idx) => {
            const startNum = idx * CHUNK_SIZE + 1;
            const endNum = Math.min((idx + 1) * CHUNK_SIZE, episodes.length);
            return (
              <button
                key={idx}
                type="button"
                className={`${styles.chunkTabBtn} ${selectedChunk === idx ? styles.activeChunkTab : ''}`}
                onClick={() => setSelectedChunk(idx)}
              >
                {startNum} - {endNum}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid of Episode Cards */}
      <div className={styles.episodeGrid}>
        {filteredEpisodes.map((ep) => (
          <Link
            key={ep.id}
            href={`/watch/${animeId}-${ep.number}?animeId=${animeId}&ep=${ep.number}`}
            className={styles.episodeCard}
            prefetch={false}
          >
            <div className={styles.epCardThumbWrapper}>
              {ep.image ? (
                <img src={ep.image} alt={ep.title} className={styles.epCardThumb} loading="lazy" />
              ) : (
                <div className={styles.epCardThumbPlaceholder}>
                  <Play size={18} />
                </div>
              )}
              <div className={styles.epPlayOverlay}>
                <Play size={20} fill="white" />
              </div>
              <span className={styles.epBadgeNum}>EP {ep.number}</span>
            </div>

            <div className={styles.epCardInfo}>
              <h4 className={styles.epCardTitle}>{ep.title}</h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
