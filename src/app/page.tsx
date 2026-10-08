import React from 'react';
import Link from 'next/link';
import HeroBanner from '@/components/HeroBanner';
import Carousel from '@/components/Carousel';
import { animeProvider } from '@/lib/anime-provider';
import {
  TrendingUp,
  Sparkles,
  Zap,
  Subtitles,
  Tv,
  ShieldCheck,
  Compass
} from 'lucide-react';
import styles from './page.module.css';

export const revalidate = 3600; // Revalidate every hour

const FEATURED_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Romance',
  'Sci-Fi',
  'Supernatural',
];

export default async function HomePage() {
  try {
    const [trending, popular] = await Promise.all([
      animeProvider.fetchTrendingAnime(1, 20),
      animeProvider.fetchPopularAnime(1, 20),
    ]);

    const featuredAnime = trending.results[0] || popular.results[0];

    return (
      <div className={styles.homeContainer}>
        {/* Cinematic Featured Hero */}
        <HeroBanner anime={featuredAnime} />

        <div className={styles.carouselsWrapper}>
          {/* Quick Genre Navigation Bar */}
          <section className={styles.genreBarSection}>
            <div className={styles.genreBarTitle}>Pilih Berdasarkan Kategori</div>
            <div className={styles.genrePillsList}>
              {FEATURED_GENRES.map((g) => (
                <Link
                  key={g}
                  href={`/search?genre=${encodeURIComponent(g)}`}
                  className={styles.genrePillLink}
                >
                  {g}
                </Link>
              ))}
            </div>
          </section>

          {/* Trending Carousel */}
          <Carousel
            title="Sedang Trending Minggu Ini"
            items={trending.results}
            icon={<TrendingUp className="text-accent-primary" size={22} />}
          />

          {/* Popular All-Time Carousel */}
          <Carousel
            title="Anime Terpopuler Sepanjang Masa"
            items={popular.results}
            icon={<Sparkles className="text-accent-secondary" size={22} />}
          />
        </div>

        {/* Feature Highlights Section */}
        <section className={styles.featuresSection}>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Zap size={24} />
              </div>
              <div className={styles.featureInfo}>
                <h3 className={styles.featureTitle}>Streaming Cepat & Anti-Lag</h3>
                <p className={styles.featureDesc}>
                  Didukung multi-server CDN berkecepatan tinggi dengan buffer instan dan mode bioskop.
                </p>
              </div>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Subtitles size={24} />
              </div>
              <div className={styles.featureInfo}>
                <h3 className={styles.featureTitle}>Subtitle Lengkap & Akurat</h3>
                <p className={styles.featureDesc}>
                  Tersedia subtitle Bahasa Indonesia dan English yang dapat diatur langsung pada player.
                </p>
              </div>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Tv size={24} />
              </div>
              <div className={styles.featureInfo}>
                <h3 className={styles.featureTitle}>Kualitas Full HD 1080p</h3>
                <p className={styles.featureDesc}>
                  Nikmati pengalaman menonton kualitas tajam di layar smartphone, tablet, maupun monitor desktop.
                </p>
              </div>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Compass size={24} />
              </div>
              <div className={styles.featureInfo}>
                <h3 className={styles.featureTitle}>Koleksi Terupdate</h3>
                <p className={styles.featureDesc}>
                  Daftar episode anime terbaru selalu sinkron secara otomatis setiap musim rilis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerLogo}>Artheanime</div>
          <div className={styles.footerLinks}>
            <Link href="/" className={styles.footerLink}>Beranda</Link>
            <Link href="/search" className={styles.footerLink}>Jelajahi</Link>
            <Link href="/search?genre=Action" className={styles.footerLink}>Aksi</Link>
            <Link href="/search?genre=Romance" className={styles.footerLink}>Romansa</Link>
          </div>
          <p className={styles.footerCopy}>
            &copy; 2026 Artheanime. Dibuat dengan Next.js, AniList GraphQL, dan React 19.
          </p>
        </footer>
      </div>
    );
  } catch (error) {
    console.error('Error loading HomePage:', error);
    return (
      <div style={{ padding: '10rem 2rem', textAlign: 'center' }}>
        <h2>Gagal memuat data anime. Silakan refresh halaman.</h2>
      </div>
    );
  }
}

