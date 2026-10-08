'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Star } from 'lucide-react';
import { getAnimeTitle, formatRating } from '@/lib/utils';
import styles from './AnimeCard.module.css';

interface AnimeCardProps {
  anime: any;
  index?: number;
}

export default function AnimeCard({ anime, index = 0 }: AnimeCardProps) {
  const title = getAnimeTitle(anime.title);
  const rating = formatRating(anime.rating);
  const epCount = anime.totalEpisodes || anime.episodes;

  return (
    <Link href={`/anime/${anime.id}`} prefetch={false} className={styles.cardLink}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      >
        <img
          src={anime.image}
          alt={title}
          className={styles.image}
          loading="lazy"
        />

        {/* Floating Top Badges */}
        <div className={styles.topBadges}>
          <span className={styles.subBadge}>SUB</span>
          {epCount && <span className={styles.epBadge}>EP {epCount}</span>}
        </div>

        {/* Hover Center Play Button */}
        <div className={styles.playIcon}>
          <Play fill="white" size={18} />
        </div>

        {/* Bottom Overlay Info */}
        <div className={styles.overlay}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.meta}>
            {rating && (
              <span className={styles.ratingBadge}>
                <Star size={11} fill="currentColor" /> {rating}
              </span>
            )}
            {anime.releaseDate && <span>{anime.releaseDate}</span>}
            {anime.type && <span className={styles.typeBadge}>{anime.type}</span>}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

