import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { MOVIE_SETTINGS } from '../constants';
import { OneLineCredit } from './OneLineCredit';
import { ExternalLink, AlertTriangle, RefreshCw, Volume2 } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerHandle {
  playSegment: (start: number, end: number, loop: boolean, onEndOnce?: () => void) => void;
  pause: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  setSpeed: (rate: number) => void;
  getDuration: () => number;
  isReady: () => boolean;
}

interface Props {
  onTimeUpdate?: (currentTime: number) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  autoPlaySegment?: { start: number; end: number; loop: boolean } | null;
  className?: string;
  showCredit?: boolean;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, Props>(({
  onTimeUpdate,
  onPlaybackStateChange,
  showCredit = true,
  className = '',
}, ref) => {
  const containerId = useRef(`yt-player-${Math.random().toString(36).substring(2, 9)}`);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);

  // Playback segment state
  const segmentRef = useRef<{
    start: number;
    end: number;
    loop: boolean;
    onEndOnce?: () => void;
    active: boolean;
    loopTimeoutId?: any;
  } | null>(null);

  const checkIntervalRef = useRef<any>(null);

  // Initialize YouTube Iframe Player
  useEffect(() => {
    let isCancelled = false;

    const initPlayer = () => {
      if (isCancelled || playerRef.current) return;
      if (!window.YT || !window.YT.Player) return;

      try {
        playerRef.current = new window.YT.Player(containerId.current, {
          videoId: MOVIE_SETTINGS.videoId,
          playerVars: {
            start: Math.floor(MOVIE_SETTINGS.startSeconds),
            end: Math.ceil(MOVIE_SETTINGS.endSeconds),
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            controls: 1,
            cc_load_policy: 0,
            origin: window.location.origin,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              if (isCancelled) return;
              setIsPlayerReady(true);
              setHasError(false);
              event.target.setPlaybackRate(currentSpeed);
            },
            onStateChange: (event: any) => {
              if (isCancelled) return;
              // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0, BUFFERING = 3
              const playing = event.data === 1;
              setIsPlaying(playing);
              onPlaybackStateChange?.(playing);

              // If video reaches the global boundary or stops
              if (event.data === 0) {
                if (segmentRef.current?.loop) {
                  // restart loop
                  playerRef.current?.seekTo(segmentRef.current.start, true);
                  playerRef.current?.playVideo();
                }
              }
            },
            onError: (event: any) => {
              if (isCancelled) return;
              console.warn('YouTube Player error:', event.data);
              // Error 101 or 150 = embedded playback disallowed by video owner
              if (event.data === 101 || event.data === 150 || event.data === 2 || event.data === 5) {
                setHasError(true);
                setErrorMessage("This video can't play inside the app. Tap to open it on YouTube.");
              }
            },
          },
        });
      } catch (err) {
        console.error('Error initializing YT Player:', err);
        setHasError(true);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // If script is loading
      const existingHandler = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (existingHandler) existingHandler();
        initPlayer();
      };

      // Also check fallback interval in case script loaded without event firing
      const pollTimer = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(pollTimer);
          initPlayer();
        }
      }, 300);

      return () => {
        clearInterval(pollTimer);
        isCancelled = true;
      };
    }

    return () => {
      isCancelled = true;
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (segmentRef.current?.loopTimeoutId) {
        clearTimeout(segmentRef.current.loopTimeoutId);
      }
      try {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      } catch {
        // ignore cleanup error
      }
    };
  }, []);

  // Continuous timer to check segment limits (PRD: check player.getCurrentTime() every 100 ms)
  useEffect(() => {
    checkIntervalRef.current = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') {
        return;
      }

      try {
        const time = playerRef.current.getCurrentTime();
        if (typeof time === 'number' && !isNaN(time)) {
          onTimeUpdate?.(time);

          // Check if active segment is playing
          const seg = segmentRef.current;
          if (seg && seg.active) {
            // When current time >= sentence.end
            if (time >= seg.end) {
              playerRef.current.pauseVideo();
              seg.active = false;

              // Fire callback once if provided (e.g., recording stopped)
              if (seg.onEndOnce) {
                const cb = seg.onEndOnce;
                seg.onEndOnce = undefined;
                cb();
              }

              // If Loop is on, wait 1.5 seconds (time for the learner to speak), then play again
              if (seg.loop) {
                if (seg.loopTimeoutId) clearTimeout(seg.loopTimeoutId);
                seg.loopTimeoutId = setTimeout(() => {
                  if (segmentRef.current && segmentRef.current.loop) {
                    segmentRef.current.active = true;
                    playerRef.current?.seekTo(seg.start, true);
                    playerRef.current?.playVideo();
                  }
                }, 1500); // 1.5 second pause for shadowing speech
              }
            }
          }
        }
      } catch {
        // Player might be re-buffering
      }
    }, 80);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [onTimeUpdate]);

  // Imperative handle for parent screens
  useImperativeHandle(ref, () => ({
    playSegment: (start: number, end: number, loop: boolean, onEndOnce?: () => void) => {
      if (segmentRef.current?.loopTimeoutId) {
        clearTimeout(segmentRef.current.loopTimeoutId);
      }
      segmentRef.current = {
        start,
        end,
        loop,
        onEndOnce,
        active: true,
      };

      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(start, true);
        playerRef.current.playVideo();
      }
    },
    pause: () => {
      if (segmentRef.current?.loopTimeoutId) {
        clearTimeout(segmentRef.current.loopTimeoutId);
      }
      if (segmentRef.current) {
        segmentRef.current.active = false;
      }
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    },
    stop: () => {
      if (segmentRef.current?.loopTimeoutId) {
        clearTimeout(segmentRef.current.loopTimeoutId);
      }
      segmentRef.current = null;
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    },
    seekTo: (seconds: number) => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seconds, true);
      }
    },
    getCurrentTime: () => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        return playerRef.current.getCurrentTime() || 0;
      }
      return 0;
    },
    setSpeed: (rate: number) => {
      setCurrentSpeed(rate);
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
        playerRef.current.setPlaybackRate(rate);
      }
    },
    getDuration: () => {
      if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
        return playerRef.current.getDuration() || 0;
      }
      return MOVIE_SETTINGS.endSeconds;
    },
    isReady: () => isPlayerReady && !hasError,
  }));

  const youtubeExternalUrl = `https://www.youtube.com/watch?v=${MOVIE_SETTINGS.videoId}&t=${Math.floor(MOVIE_SETTINGS.startSeconds)}s`;

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      {/* 16:9 Player container */}
      <div className="relative w-full aspect-video bg-stone-900 rounded-2xl overflow-hidden shadow-md">
        {/* The YouTube iframe mount div */}
        <div 
          id={containerId.current} 
          className={`w-full h-full ${hasError ? 'hidden' : 'block'}`} 
        />

        {/* Loading state indicator before YT API initializes */}
        {!isPlayerReady && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900 text-stone-300 gap-2 p-4 text-center">
            <RefreshCw className="w-7 h-7 animate-spin text-emerald-400" />
            <p className="text-sm font-medium">Loading Zootopia clip...</p>
            <p className="text-xs text-stone-400">0:49 – 1:34 (Judy & Parents)</p>
          </div>
        )}

        {/* Fallback Screen if YouTube embeds are restricted (Error 101/150) */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-stone-100 max-w-xs">
              {errorMessage || "This video can't play inside the app."}
            </p>
            <p className="text-xs text-stone-400 mt-1 max-w-xs">
              이 영상은 YouTube 설정으로 인해 외부 플레이어에서 열어야 할 수 있습니다. 아래 버튼을 눌러 YouTube에서 열어보세요. (앱 내 텍스트, 녹음 및 단어 체크는 정상 작동합니다)
            </p>
            <a
              href={youtubeExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <span>Open on YouTube (0:49)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Mandatory one-line credit under video on every screen with a video */}
      {showCredit && (
        <OneLineCredit />
      )}
    </div>
  );
});

YouTubePlayer.displayName = 'YouTubePlayer';
