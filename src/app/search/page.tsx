import React, { Suspense } from 'react';
import SearchClient from './SearchClient';
import styles from './Search.module.css';

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.headerArea}>
            <div className="skeleton" style={{ height: '40px', width: '300px', margin: '0 auto 1rem' }} />
            <div className="skeleton" style={{ height: '56px', width: '100%', maxWidth: '680px', margin: '0 auto' }} />
          </div>
          <div className={styles.grid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className="skeleton" style={{ width: '100%', height: '100%' }} />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}

