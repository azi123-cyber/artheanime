'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Info, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAnimeTitle, stripHtml, formatRating } from '@/lib/utils';
import styles from './HeroBanner.module.css';

interface HeroBannerProps {
  anime: any;
}

export default function HeroBanner({ anime }: HeroBannerProps) {
  if (!anime) return null;

  const title = getAnimeTitle(anime.title);
  const desc = stripHtml(anime.description || '');
  const coverImage = anime.cover || anime.image;
  const genres = anime.genres?.slice(0, 3) || [];
  const rating = formatRating(anime.rating);
  const watchUrl = `/watch/${anime.id}-1?animeId=${anime.id}&ep=1`;

  return (
    <div className={styles.hero}>
      <img src={coverImage} alt={title} className={styles.background} />
      <div className={styles.overlay} />

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        {genres.length > 0 && (
          <div className={styles.genreTag}>
            {genres[0]}
          </div>
        )}

        <h1 className={styles.title}>{title}</h1>

        <div className={styles.meta}>
          {rating && (
            <span className={styles.rating}>
              <Star size={14} fill="currentColor" /> {rating}
            </span>
          )}
          {anime.releaseDate && (
            <>
              <span className={styles.dot} />
              <span>{anime.releaseDate}</span>
            </>
          )}
          {anime.totalEpisodes && (
            <>
              <span className={styles.dot} />
              <span>{anime.totalEpisodes} Episodes</span>
            </>
          )}
          {anime.type && (
            <>
              <span className={styles.dot} />
              <span>{anime.type}</span>
            </>
          )}
        </div>

        <p className={styles.description}>{desc || 'Saksikan anime seru ini dengan kualitas HD dan subtitle lengkap.'}</p>

        <div className={styles.actions}>
          <Link href={watchUrl} className={styles.playBtn} prefetch={false}>
            <Play fill="currentColor" size={20} />
            Nonton Sekarang
          </Link>
          <Link href={`/anime/${anime.id}`} className={styles.infoBtn} prefetch={false}>
            <Info size={20} />
            Detail
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

