'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Server,
  Subtitles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Check,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Keyboard
} from 'lucide-react';
import styles from './VideoPlayer.module.css';

export interface VideoServer {
  server: string;
  name: string;
  type: 'embed' | 'hls';
  url: string;
  isDefault?: boolean;
}

export interface SubtitleTrack {
  lang: string;
  label: string;
  url?: string;
  isDefault?: boolean;
}

interface VideoPlayerProps {
  servers?: VideoServer[];
  defaultSrc?: string;
  poster?: string;
  animeTitle?: string;
  episodeNumber?: number;
  subtitles?: SubtitleTrack[];
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPrevEpisode?: boolean;
}

export default function VideoPlayer({
  servers = [],
  defaultSrc,
  poster,
  animeTitle,
  episodeNumber,
  subtitles = [],
  onNextEpisode,
  onPrevEpisode,
  hasNextEpisode,
  hasPrevEpisode,
}: VideoPlayerProps) {
  // Build active servers list
  const activeServers: VideoServer[] = servers.length > 0
    ? servers
    : [
        {
          server: 'vidsrc',
          name: 'Server 1 - VidSrc HD (Auto Sub Indo & Eng)',
          type: defaultSrc?.includes('.m3u8') ? 'hls' : 'embed',
          url: defaultSrc || 'https://vidsrc.me/embed/anime?anilist=21&ep=1',
          isDefault: true,
        },
      ];

  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedSub, setSelectedSub] = useState<string>('Indonesian');
  const [isAdShieldActive, setIsAdShieldActive] = useState<boolean>(true);
  const [blockedCount, setBlockedCount] = useState<number>(0);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const currentServer = activeServers[currentServerIndex] || activeServers[0];

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isInternalNavigationRef = useRef<boolean>(false);
  const isPlayerHoveredRef = useRef<boolean>(false);

  // Initialize preference from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('artheanime_adshield');
    if (saved !== null) {
      setIsAdShieldActive(saved === 'true');
    }
  }, []);

  const toggleAdShield = () => {
    const nextVal = !isAdShieldActive;
    setIsAdShieldActive(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('artheanime_adshield', String(nextVal));
    }
    setToastMessage(nextVal ? '🛡️ Filter Ketat Anti-Judol Diaktifkan' : '⚠️ Filter Anti-Judol Dinonaktifkan');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Anti-Judol & Anti-Redirect Navigation Guard
  // Intercepts external redirects (when ads attempt window.top.location = ...)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect internal Artheanime link clicks so legitimate user navigation is never blocked
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && (href.startsWith('/') || href.startsWith('#') || href.includes(window.location.host))) {
          isInternalNavigationRef.current = true;
          setTimeout(() => {
            isInternalNavigationRef.current = false;
          }, 3000);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick, true);

    // Top-Navigation Guard:
    // Prevents rogue ad scripts from redirecting the user to judol when play/pause is clicked
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isAdShieldActive && !isInternalNavigationRef.current) {
        e.preventDefault();
        const alertMsg = 'Artheanime AdShield: Pengalihan paksa ke situs judi online dicegah! Tetap di halaman ini untuk melanjutkan nonton.';
        e.returnValue = alertMsg;
        setBlockedCount((prev) => prev + 1);
        setToastMessage('🛡️ Pengalihan ke web judol berhasil dicegah!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
        return alertMsg;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAdShieldActive]);

  // Anti-Popup & Pop-Under Focus Loss Trap
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalOpen = window.open;
    if (isAdShieldActive) {
      window.open = function (url?: string | URL, target?: string, features?: string) {
        console.warn('[Artheanime AdShield] Pop-up blocked:', url);
        setBlockedCount((prev) => prev + 1);
        setToastMessage('🛡️ Pop-up iklan dicegah.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
        return {
          closed: true,
          focus: () => {},
          blur: () => {},
          close: () => {},
          location: { href: '' },
        } as unknown as Window;
      };
    }

    const handleWindowBlur = () => {
      if (isAdShieldActive && isPlayerHoveredRef.current) {
        // Window lost focus right when interacting with the video player (pop-under attempt)
        setTimeout(() => {
          window.focus();
        }, 120);
        setBlockedCount((prev) => prev + 1);
        setToastMessage('🛡️ Upaya pop-under dicegah. Fokus tetap pada video.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    };

    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.open = originalOpen;
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isAdShieldActive]);

  // Save watch progress to localStorage so user never starts over
  useEffect(() => {
    if (typeof window === 'undefined' || !animeTitle) return;
    try {
      const storageKey = `artheanime_progress_${encodeURIComponent(animeTitle)}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          episodeNumber: episodeNumber || 1,
          serverIndex: currentServerIndex,
          serverName: currentServer.name,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [animeTitle, episodeNumber, currentServerIndex, currentServer.name]);

  // Keyboard shortcut listener (Spacebar for Native HLS play/pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;
        if (currentServer?.type === 'hls' && videoRef.current) {
          e.preventDefault();
          if (videoRef.current.paused) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentServer?.type]);

  // Handle server switch or reload
  const handleServerChange = (index: number) => {
    isInternalNavigationRef.current = true;
    setCurrentServerIndex(index);
    setIsLoading(true);
    setHasError(false);
    setReloadKey((prev) => prev + 1);
  };

  const handleReload = () => {
    setIsLoading(true);
    setHasError(false);
    setReloadKey((prev) => prev + 1);
    setToastMessage('🔄 Memuat ulang pemutar video...');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleNext = () => {
    isInternalNavigationRef.current = true;
    if (onNextEpisode) onNextEpisode();
  };

  const handlePrev = () => {
    isInternalNavigationRef.current = true;
    if (onPrevEpisode) onPrevEpisode();
  };

  // Setup HLS if current server is direct HLS
  useEffect(() => {
    if (currentServer?.type !== 'hls') {
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video || !currentServer.url) return;

    setHasError(false);
    setIsLoading(true);

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(currentServer.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              setHasError(true);
              setIsLoading(false);
              hls?.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentServer.url;
      video.onloadedmetadata = () => setIsLoading(false);
      video.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
    } else {
      setHasError(true);
      setIsLoading(false);
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [currentServer, reloadKey]);

  return (
    <div className={`${styles.playerContainer} ${isTheaterMode ? styles.theaterMode : ''}`}>
      {/* Top Bar: Server Switcher & Stream Quality Badges */}
      <div className={styles.topBar}>
        <div className={styles.serverList}>
          <div className={styles.serverLabel}>
            <Server size={14} className={styles.serverIcon} />
            <span>Pilih Server:</span>
          </div>
          {activeServers.map((s, idx) => (
            <button
              key={`${s.server}-${idx}`}
              className={`${styles.serverBtn} ${currentServerIndex === idx ? styles.activeServer : ''}`}
              onClick={() => handleServerChange(idx)}
              type="button"
            >
              {currentServerIndex === idx && <Check size={12} className={styles.checkIcon} />}
              {s.name}
            </button>
          ))}
        </div>

        <div className={styles.topActions}>
          <button
            className={`${styles.adShieldBtn} ${isAdShieldActive ? styles.adShieldActive : ''}`}
            onClick={toggleAdShield}
            title={isAdShieldActive ? 'Filter Ketat Anti-Judol Aktif (Klik untuk nonaktifkan)' : 'Filter Anti-Judol Nonaktif (Klik untuk aktifkan)'}
            type="button"
          >
            {isAdShieldActive ? <ShieldCheck size={14} className={styles.shieldIcon} /> : <ShieldAlert size={14} />}
            <span className={styles.hideMobile}>
              {isAdShieldActive ? 'Filter Ketat ON' : 'Filter OFF'}
            </span>
            {blockedCount > 0 && isAdShieldActive && (
              <span className={styles.blockedBadge} title={`${blockedCount} pengalihan/pop-up dicegah`}>
                +{blockedCount}
              </span>
            )}
          </button>
          <button
            className={styles.actionBtn}
            onClick={handleReload}
            title="Muat Ulang Pemutar"
            type="button"
          >
            <RotateCcw size={14} />
            <span>Reload</span>
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            title={isTheaterMode ? 'Keluar Mode Bioskop' : 'Mode Bioskop (Theater Mode)'}
            type="button"
          >
            {isTheaterMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className={styles.hideMobile}>Theater</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div
        className={styles.videoViewport}
        onMouseEnter={() => { isPlayerHoveredRef.current = true; }}
        onMouseLeave={() => { isPlayerHoveredRef.current = false; }}
      >
        {/* Floating Notification Toast */}
        {showToast && (
          <div className={styles.adShieldToast}>
            <ShieldCheck size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {isLoading && currentServer?.type === 'embed' && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
            <p>Menyiapkan streaming HD & subtitle...</p>
          </div>
        )}

        {hasError ? (
          <div className={styles.errorOverlay}>
            <AlertTriangle size={48} className={styles.errorIcon} />
            <h3>Gagal memuat streaming pada server ini</h3>
            <p>Silakan coba pilih server alternatif lainnya di atas.</p>
            <div className={styles.errorActions}>
              <button onClick={() => handleServerChange((currentServerIndex + 1) % activeServers.length)} className={styles.switchServerBtn}>
                Ganti ke Server Berikutnya
              </button>
              <button onClick={handleReload} className={styles.retryBtn}>
                Coba Lagi
              </button>
            </div>
          </div>
        ) : currentServer?.type === 'embed' ? (
          <iframe
            key={`${currentServer.url}-${reloadKey}`}
            ref={iframeRef}
            src={currentServer.url}
            className={styles.iframePlayer}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          <video
            key={`${currentServer?.url}-${reloadKey}`}
            ref={videoRef}
            className={styles.nativeVideo}
            controls
            poster={poster}
            playsInline
          >
            {subtitles.map((sub) => (
              <track
                key={sub.lang}
                kind="subtitles"
                label={sub.label}
                srcLang={sub.lang.slice(0, 2).toLowerCase()}
                src={sub.url}
                default={sub.isDefault}
              />
            ))}
          </video>
        )}
      </div>

      {/* Quick Keyboard Helper Banner */}
      <div className={styles.tipsBanner}>
        <Keyboard size={13} />
        <span>Tips Nonton Nyaman: Tekan tombol <kbd className={styles.keyboardShortcut}>Spasi</kbd> untuk Play / Pause langsung tanpa risiko tersentuh klik iklan judol.</span>
      </div>

      {/* Subtitle & Quick Navigation Bar Below Player */}
      <div className={styles.subBar}>
        <div className={styles.subInfo}>
          <div className={styles.badgeSub}>
            <Subtitles size={14} />
            <span>Subtitle Multi-Bahasa Aktif</span>
          </div>
          {isAdShieldActive && (
            <div className={styles.badgeShield}>
              <ShieldCheck size={14} />
              <span>Anti-Redirect Judol Aktif</span>
            </div>
          )}
          <span className={styles.subHint}>
            🛡️ Pengalihan paksa (redirect) ke situs judol saat Play/Pause otomatis dicegah oleh sistem. Subtitle tersedia di tombol <strong>CC</strong> player.
          </span>
        </div>

        {/* Quick Server Switcher Pills */}
        <div className={styles.serverQuickSwitch}>
          <span className={styles.serverQuickLabel}>Ganti Server:</span>
          {activeServers.map((s, idx) => (
            <button
              key={s.server}
              className={`${styles.serverPill} ${currentServerIndex === idx ? styles.activePill : ''}`}
              onClick={() => handleServerChange(idx)}
              type="button"
              title={`Beralih ke ${s.name}`}
            >
              {currentServerIndex === idx && <Check size={11} />}
              <span>Server {idx + 1}</span>
            </button>
          ))}
        </div>

        <div className={styles.navControls}>
          {hasPrevEpisode && onPrevEpisode && (
            <button className={styles.navBtn} onClick={handlePrev} type="button">
              <ChevronLeft size={16} />
              <span>Episode Sebelumnya</span>
            </button>
          )}
          {hasNextEpisode && onNextEpisode && (
            <button className={`${styles.navBtn} ${styles.navBtnNext}`} onClick={handleNext} type="button">
              <span>Episode Berikutnya</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

