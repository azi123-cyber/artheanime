'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, Filter, Sparkles, AlertCircle } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import styles from './Search.module.css';

const GENRES = [
  'All',
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Romance',
  'Sci-Fi',
  'Supernatural',
];

const FORMATS = [
  { label: 'Semua Format', value: 'All' },
  { label: 'TV Series', value: 'TV' },
  { label: 'Movie (Film)', value: 'MOVIE' },
  { label: 'OVA / Special', value: 'OVA' },
];

export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || 'All';
  const initialFormat = searchParams.get('format') || 'All';

  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedFormat, setSelectedFormat] = useState(initialFormat);

  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync state if URL changes externally
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setSelectedGenre(searchParams.get('genre') || 'All');
    setSelectedFormat(searchParams.get('format') || 'All');
  }, [searchParams]);

  // Fetch search results with debouncing
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (selectedGenre && selectedGenre !== 'All') params.set('genre', selectedGenre);
        if (selectedFormat && selectedFormat !== 'All') params.set('format', selectedFormat);

        // Update URL shallowly
        const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
        window.history.replaceState(null, '', newUrl);

        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) throw new Error('Gagal mengambil data pencarian');
        const data = await res.json();

        if (!isCancelled) {
          setResults(data.results || []);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error(err);
          setError('Terjadi kesalahan saat mencari anime. Coba lagi.');
          setIsLoading(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query, selectedGenre, selectedFormat]);

  const handleClear = () => {
    setQuery('');
    setSelectedGenre('All');
    setSelectedFormat('All');
    router.replace('/search');
  };

  return (
    <div className={styles.container}>
      {/* Search Header */}
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Jelajahi & Cari Anime</h1>
        <p className={styles.subtitle}>
          Temukan anime favoritmu dari ribuan judul dengan streaming HD dan subtitle lengkap.
        </p>

        {/* Search Bar Input */}
        <div className={styles.searchBarWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik judul anime, misal: Naruto, One Piece, Solo Leveling..."
            className={styles.searchInput}
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className={styles.clearBtn}
              aria-label="Hapus teks"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className={styles.filtersSection}>
          <div className={styles.filterRow}>
            <div className={styles.genrePills}>
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`${styles.pillBtn} ${selectedGenre === g ? styles.pillActive : ''}`}
                  onClick={() => setSelectedGenre(g)}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className={styles.formatSelectWrapper}>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className={styles.formatSelect}
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>
            {query.trim() ? (
              <>Hasil untuk "{query}"</>
            ) : selectedGenre !== 'All' ? (
              <>Koleksi Genre {selectedGenre}</>
            ) : (
              <>
                <Sparkles size={18} className={styles.sparkleIcon} />
                <span>Rekomendasi Anime Populer</span>
              </>
            )}
          </h2>

          {!isLoading && results.length > 0 && (
            <span className={styles.resultCount}>
              {results.length} anime ditemukan
            </span>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className={styles.grid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className="skeleton" style={{ width: '100%', height: '100%' }} />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className={styles.errorBox}>
            <AlertCircle size={36} className={styles.errorIcon} />
            <p>{error}</p>
            <button onClick={handleClear} className={styles.resetBtn}>
              Reset Pencarian
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && results.length === 0 && (
          <div className={styles.emptyBox}>
            <p className={styles.emptyTitle}>Tidak ada anime yang cocok</p>
            <p className={styles.emptyDesc}>
              Coba gunakan kata kunci lain atau pilih genre di atas.
            </p>
            <button onClick={handleClear} className={styles.resetBtn}>
              Lihat Anime Populer
            </button>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && !error && results.length > 0 && (
          <div className={styles.grid}>
            {results.map((anime, index) => (
              <AnimeCard key={anime.id} anime={anime} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
