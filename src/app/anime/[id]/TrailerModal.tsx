'use client';

import React, { useState } from 'react';
import { Film, X, Play } from 'lucide-react';
import styles from './AnimeDetail.module.css';

interface TrailerModalProps {
  trailerId?: string | null;
  trailerSite?: string | null;
  animeTitle: string;
}

export default function TrailerModal({ trailerId, trailerSite, animeTitle }: TrailerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!trailerId || trailerSite !== 'youtube') return null;

  return (
    <>
      <button
        type="button"
        className={styles.trailerBtn}
        onClick={() => setIsOpen(true)}
      >
        <Film size={18} />
        <span>Tonton Trailer</span>
      </button>

      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Trailer: {animeTitle}</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsOpen(false)}
                aria-label="Tutup Trailer"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.trailerFrameWrapper}>
              <iframe
                src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
                title={`${animeTitle} Trailer`}
                className={styles.trailerIframe}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
