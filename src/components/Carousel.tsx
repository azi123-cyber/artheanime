'use client';

import React, { useRef } from 'react';
import AnimeCard from './AnimeCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Carousel.module.css';

interface CarouselProps {
  title: string;
  items: any[];
  icon?: React.ReactNode;
}

export default function Carousel({ title, items, icon }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -650 : 650;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <h2 className={styles.title}>{title}</h2>
        </div>

        <div className={styles.navControls}>
          <button
            type="button"
            className={styles.scrollBtn}
            onClick={() => scroll('left')}
            aria-label="Geser ke kiri"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className={styles.scrollBtn}
            onClick={() => scroll('right')}
            aria-label="Geser ke kanan"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div ref={trackRef} className={styles.track}>
        {items.map((item, index) => (
          <AnimeCard key={item.id || index} anime={item} index={index} />
        ))}
      </div>
    </div>
  );
}

