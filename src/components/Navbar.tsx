'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X, Menu, Play, Star, Sparkles, Film } from 'lucide-react';
import { getAnimeTitle, formatRating } from '@/lib/utils';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut (Ctrl+K or /) to open quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSuggestions([]);
    }
  }, [isSearchOpen]);

  // Debounced search suggestions inside quick modal
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}&perPage=6`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results?.slice(0, 5) || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectAnime = (id: string) => {
    setIsSearchOpen(false);
    router.push(`/anime/${id}`);
  };

  const handleFullSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header
        className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}
        suppressHydrationWarning
      >
        <div className={styles.navContainer} suppressHydrationWarning>
          <div className={styles.leftGroup}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoDot} />
              <span className={styles.logoText}>Arthe<span className={styles.logoAccent}>anime</span></span>
            </Link>

            <nav className={styles.navLinks}>
              <Link
                href="/"
                className={`${styles.link} ${pathname === '/' ? styles.linkActive : ''}`}
              >
                Beranda
              </Link>
              <Link
                href="/search"
                className={`${styles.link} ${pathname === '/search' ? styles.linkActive : ''}`}
              >
                Jelajahi
              </Link>
              <Link
                href="/search?genre=Action"
                className={styles.link}
              >
                Aksi
              </Link>
              <Link
                href="/search?genre=Romance"
                className={styles.link}
              >
                Romansa
              </Link>
            </nav>
          </div>

          <div className={styles.actions}>
            {/* Quick Search Trigger Button */}
            <button
              type="button"
              className={styles.searchBarTrigger}
              onClick={() => setIsSearchOpen(true)}
              aria-label="Cari anime"
            >
              <Search size={16} />
              <span className={styles.searchTriggerText}>Cari anime...</span>
              <kbd className={styles.kbdShortcut}>Ctrl+K</kbd>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              className={styles.mobileToggleBtn}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className={styles.mobileDrawer}>
            <Link
              href="/"
              className={`${styles.mobileLink} ${pathname === '/' ? styles.mobileLinkActive : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Beranda
            </Link>
            <Link
              href="/search"
              className={`${styles.mobileLink} ${pathname === '/search' ? styles.mobileLinkActive : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Jelajahi Anime
            </Link>
            <Link
              href="/search?genre=Action"
              className={styles.mobileLink}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Genre Aksi
            </Link>
            <Link
              href="/search?genre=Romance"
              className={styles.mobileLink}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Genre Romansa
            </Link>
          </div>
        )}
      </header>

      {/* Quick Search Modal */}
      {isSearchOpen && (
        <div className={styles.searchModalOverlay} onClick={() => setIsSearchOpen(false)}>
          <div className={styles.searchModalCard} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleFullSearch} className={styles.modalInputWrapper}>
              <Search size={20} className={styles.modalSearchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ketik judul anime, misal: Naruto, One Piece, Bleach..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.modalInput}
              />
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsSearchOpen(false)}
              >
                <X size={18} />
              </button>
            </form>

            {/* Live Suggestions List */}
            <div className={styles.suggestionsContainer}>
              {isSearching && (
                <div className={styles.searchingNotice}>
                  <div className={styles.miniSpinner} />
                  <span>Mencari anime...</span>
                </div>
              )}

              {!isSearching && suggestions.length > 0 && (
                <div className={styles.suggestionList}>
                  {suggestions.map((item) => {
                    const title = getAnimeTitle(item.title);
                    const rating = formatRating(item.rating);
                    return (
                      <div
                        key={item.id}
                        className={styles.suggestionItem}
                        onClick={() => handleSelectAnime(item.id)}
                      >
                        <img src={item.image} alt={title} className={styles.suggThumb} />
                        <div className={styles.suggInfo}>
                          <h4 className={styles.suggTitle}>{title}</h4>
                          <div className={styles.suggMeta}>
                            {rating && (
                              <span className={styles.suggRating}>
                                <Star size={11} fill="currentColor" /> {rating}
                              </span>
                            )}
                            {item.releaseDate && <span>{item.releaseDate}</span>}
                            {item.type && <span className={styles.suggType}>{item.type}</span>}
                          </div>
                        </div>
                        <Play size={16} className={styles.suggPlay} />
                      </div>
                    );
                  })}

                  <button
                    type="submit"
                    onClick={handleFullSearch}
                    className={styles.viewAllResultsBtn}
                  >
                    Lihat semua hasil pencarian untuk "{searchQuery}"
                  </button>
                </div>
              )}

              {!isSearching && searchQuery.trim() && suggestions.length === 0 && (
                <div className={styles.noSuggNotice}>
                  <p>Tidak ditemukan anime dengan kata kunci "{searchQuery}"</p>
                </div>
              )}

              {!searchQuery.trim() && (
                <div className={styles.modalHints}>
                  <span>💡 Tip: Tekan <kbd>Enter</kbd> untuk hasil lengkap atau pilih saran langsung.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

