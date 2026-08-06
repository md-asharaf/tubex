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
  useEffect(() => {
    const initializePlayer = () => {
      const video = videoRef.current;
      if (!video) return;

      const defaultOptions: Plyr.Options = {
        hideControls: true,
        controls,
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

      if (!Hls.isSupported()) {
        video.src = source;
        playerRef.current = new Plyr(video, defaultOptions);
      } else {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(source);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
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

          playerRef.current.on("ready", () => {
            if (playerRef.current) {
              playerRef.current.muted = true;
              playerRef.current.captions.active = false;
            }
          });
        });

        hls.attachMedia(video);
      }
    };

    initializePlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (playerRef && playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [source]);

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
