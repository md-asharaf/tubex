import { useEffect, useRef, useState } from "react";
// @ts-ignore
import Plyr from "plyr";
import Hls from "hls.js";
import "plyr/dist/plyr.css";

export const PlyrPlayer = ({
  source,
  subtitle = "",
  className = "",
  thumbnailPreviews = "",
  playerRef,
  onViewTracked = () => { },
  minWatchTime = 15,
  controls,
  thumbnail,
  onEnded = () => { },
  trackProgressId = null,
  userId = null,
  muted = undefined,
  volume = undefined,
  captions = undefined,
  loop = false,
  autoplay = true,
  disableStorage = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [watchTime, setWatchTime] = useState(0);
  const [hasWatched, setHasWatched] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  const bitrateToResolution = {
    "500000": 360,
    "1000000": 480,
    "2500000": 720,
    "5000000": 1080,
  };

  const applyInitialState = (player: any) => {
    if (muted !== undefined) player.muted = muted;
    if (volume !== undefined) player.volume = volume;
    if (captions !== undefined) player.captions.active = captions;
    player.loop = loop;
  };

  useEffect(() => {
    let isMounted = true;

    const initializePlayer = () => {
      const video = videoRef.current;
      if (!video) return;

      const setupProgressTracking = (player: any) => {
        if (!trackProgressId) return;
        const storageKey = `video-progress-${userId || 'guest'}`;

        const handleRestore = () => {
          try {
            const savedProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');
            if (savedProgress[trackProgressId]) {
              player.currentTime = savedProgress[trackProgressId];
            }
          } catch (e) {}
        };

        let hasRestored = false;
        player.on('loadedmetadata', () => {
          if (hasRestored) return;
          hasRestored = true;
          handleRestore();
        });
        
        // Fallback for HLS or edge cases where loadedmetadata fires early
        player.on('playing', () => {
          if (hasRestored) return;
          hasRestored = true;
          handleRestore();
        });

        let lastSavedTime = 0;
        player.on('timeupdate', () => {
          const ct = player.currentTime;
          if (Math.abs(ct - lastSavedTime) > 3) {
            lastSavedTime = ct;
            try {
              const progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
              const duration = player.duration;
              
              if (duration && ct > duration - 5) {
                delete progress[trackProgressId];
              } else {
                progress[trackProgressId] = ct;
              }
              localStorage.setItem(storageKey, JSON.stringify(progress));
            } catch (e) {}
          }
        });
      };

      const defaultOptions: Plyr.Options = {
        hideControls: true,
        controls,
        autoplay,
        clickToPlay: false,
        storage: { enabled: !disableStorage, key: 'plyr' },
        settings: ["quality", "captions", "speed"],
        previewThumbnails: {
          enabled: !!thumbnailPreviews,
          src: thumbnailPreviews,
        },
        tooltips: { controls: true, seek: true },
        speed: {
          selected: 1,
          options: [0.5, 1, 1.5, 2],
        }
      };

      const isHls = source?.includes('.m3u8');

      if (!isHls || !Hls.isSupported()) {
        video.src = source;
        playerRef.current = new Plyr(video, defaultOptions);
        applyInitialState(playerRef.current);
        setupProgressTracking(playerRef.current);

        if (autoplay) {
          const playPromise = playerRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((error: any) => {
              if (error.name === 'NotAllowedError' && playerRef.current) {
                playerRef.current.muted = true;
                playerRef.current.play().catch(() => {});
              }
            });
          }
        }
      } else {
        const hls = new Hls();
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!isMounted) return;
          
          const availableQualities = hls.levels.map(
            (l) => bitrateToResolution[l.bitrate]
          );
          availableQualities.unshift(0);

          defaultOptions.quality = {
            default: 1,
            options: availableQualities,
            forced: true,
            onChange: (newQuality: number) => {
              if (newQuality === 0) {
                hls.currentLevel = -1;
              } else {
                hls.levels.forEach((level, index) => {
                  if (
                    bitrateToResolution[level.bitrate] ===
                    newQuality
                  ) {
                    hls.currentLevel = index;
                  }
                });
              }
            },
          };

          defaultOptions.i18n = {
            qualityLabel: { 0: "Auto" },
          };

          playerRef.current = new Plyr(video, defaultOptions);
          setupProgressTracking(playerRef.current);

          playerRef.current.on("ready", () => {
            if (playerRef.current) {
              applyInitialState(playerRef.current);
              
              if (autoplay) {
                const playPromise = playerRef.current.play();
                if (playPromise !== undefined) {
                  playPromise.catch((error: any) => {
                    if (error.name === 'NotAllowedError' && playerRef.current) {
                      playerRef.current.muted = true;
                      playerRef.current.play().catch(() => {});
                    }
                  });
                }
              }
            }
          });
        });

        hls.loadSource(source);
        hls.attachMedia(video);
      }
    };

    initializePlayer();

    return () => {
      isMounted = false;
      if (hlsRef.current) {
        try {
          hlsRef.current.stopLoad();
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
        } catch (e) {}
        hlsRef.current = null;
      }
      if (playerRef && playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [source, trackProgressId, userId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.paused || video.ended) return;
      const currentTime = video.currentTime;
      setWatchTime((prev) => prev + (currentTime - lastUpdateTime));
      setLastUpdateTime(currentTime);
    };

    const events = ["play", "pause", "seeking", "seeked", "timeupdate"];
    events.forEach((event) =>
      video.addEventListener(event, handleTimeUpdate)
    );

    if (watchTime >= minWatchTime && !hasWatched) {
      setHasWatched(true);
      onViewTracked();
    }

    return () => {
      events.forEach((event) =>
        video.removeEventListener(event, handleTimeUpdate)
      );
    };
  }, [watchTime, hasWatched, lastUpdateTime]);

  return (
    <div className="sm:rounded-xl object-cover overflow-hidden">
      <video
        ref={videoRef}
        className={`plyr-react plyr ${className}`}
        crossOrigin="anonymous"
        preload="none"
        autoPlay
        poster={thumbnail}
        onEnded={onEnded}
      >
        {subtitle && (
          <track
            kind="subtitles"
            label="English"
            srcLang="en"
            src={subtitle}
            default
          />
        )}
      </video>
    </div>
  );
};
