import { useState, useEffect, useRef } from "react";
import { formatDuration, formatViews } from "@/lib/utils";
import { PlyrPlayer } from "../video-player";
import { Volume2, VolumeX, Subtitles } from "lucide-react";
import { IVideoData } from "@/interfaces";
import { AvatarImg } from "@/components/root/avatar-image";
import { useNavigate } from "react-router-dom";
import { getRelativeShortTime } from "@/lib/time";
import { ThreeDots } from "@/components/root/three-dots";
import { useIntersection } from "@mantine/hooks";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface Props {
  video: IVideoData;
  playerRef?: React.MutableRefObject<any>;
  isAvatar?: boolean;
  putExtraOptions?: boolean;
}

export const VideoCard: React.FC<Props> = ({
  video,
  playerRef = null,
  isAvatar = false,
  putExtraOptions = false,
}) => {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(true);
  const [isCCEnabled, setIsCCEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  const { ref, entry } = useIntersection({
    rootMargin: "-40% 0px -40% 0px",
    threshold: 0,
  });

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startHover = () => {
    window.dispatchEvent(new CustomEvent('preview-started', { detail: { id: video._id } }));
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 1000);
  };

  const stopHover = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  useEffect(() => {
    if (isMobile) {
      if (entry?.isIntersecting) {
        startHover();
      } else {
        stopHover();
      }
    }
  }, [entry?.isIntersecting, isMobile]);

  useEffect(() => {
    const handlePreviewStarted = (e: any) => {
      if (e.detail.id !== video._id) {
        stopHover();
      }
    };
    window.addEventListener('preview-started', handlePreviewStarted);
    return () => window.removeEventListener('preview-started', handlePreviewStarted);
  }, [video._id]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const userId = useSelector((state: RootState) => state.auth.userData?._id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      const storageKey = `video-progress-${userId || 'guest'}`;
      const savedProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (savedProgress[video._id] && video.duration) {
        setProgress((savedProgress[video._id] / parseFloat(video.duration)) * 100);
      }
    } catch (e) { }
  }, [video._id, video.duration, userId]);

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;

    player.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleCC = () => {
    const player = playerRef.current;
    if (!player) return;
    player.toggleCaptions();
    setIsCCEnabled(!isCCEnabled);
  };
  return (
    <div
      onMouseEnter={() => { if (!isMobile) startHover() }}
      onMouseLeave={() => { if (!isMobile) stopHover() }}
      className="relative group flex flex-col gap-2 rounded-lg p-2"
      ref={ref}
    >
      <div>
        <div className="aspect-video">
          {!isHovered ? (
            <div className="relative w-full h-full">
              <img
                src={video.thumbnail}
                alt="Video thumbnail"
                className={`w-full h-full object-cover rounded-xl`}
                loading="lazy"
              />
              <p className="absolute right-2 bottom-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded z-10">
                {formatDuration(video.duration)}
              </p>
              {progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-xl overflow-hidden z-0">
                  <div
                    className="h-full bg-red-600"
                    style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              className="relative w-full h-full"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('.plyr__controls')) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <PlyrPlayer
                thumbnail={video.thumbnail}
                key={video._id}
                source={video.source}
                subtitle={video.subtitle}
                playerRef={playerRef}
                controls={["progress"]}
                muted={true}
                disableStorage={true}
                className="w-full h-full"
              />
              <p className="absolute right-2 bottom-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                {formatDuration(video.duration)}
              </p>
              {putExtraOptions && (
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
                  <button
                    className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleMute();
                    }}
                  >
                    {isMuted ? (
                      <VolumeX size={20} />
                    ) : (
                      <Volume2 size={20} />
                    )}
                  </button>
                  <button
                    className={`bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-75 transition ${isCCEnabled
                      ? "text-blue-500"
                      : "text-white"
                      }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCC();
                    }}
                  >
                    <Subtitles size={20} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex space-x-3 dark:text-white items-start mt-3">
        {isAvatar && (
          <AvatarImg
            className="w-10 h-10 rounded-full object-cover aspect-square"
            avatar={video.creator.avatar}
            fullname={video.creator.fullname}
          />
        )}
        <div className="flex-1 overflow-hidden">
          <h3
            className={`font-semibold text-[16px] leading-snug line-clamp-2 ${!video.creator && "text-sm"
              }`}
          >
            {video.title}
          </h3>
          <div className="flex flex-wrap items-center mt-1 text-[13px] sm:text-[14px] text-muted-foreground leading-snug">
            {video.creator && (
              <>
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/channel/${video.creator.username}`);
                  }}
                  className="font-normal hover:text-foreground truncate cursor-pointer"
                >
                  {video.creator.fullname}
                </span>
                <span className="mx-1.5">•</span>
              </>
            )}
            <span className="truncate">
              {`${formatViews(
                video.views
              )} • ${getRelativeShortTime(new Date(video.createdAt))}`}
            </span>
          </div>
        </div>
        <ThreeDots videoId={video._id} />
      </div>
    </div>
  );
};
