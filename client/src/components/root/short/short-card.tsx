import { useEffect, useRef, useState } from "react";
import { PlyrPlayer } from "@/components/root/video-player";
import { useMutation } from "@tanstack/react-query";
import { shortService } from "@/services/short";

export const ShortCard = ({ short, playerRef }) => {
  const { mutate: increaseViews } = useMutation({
    mutationFn: async (shortId: string) => {
      await shortService.incrementViews(shortId);
    },
  });
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const startHover = () => {
    window.dispatchEvent(new CustomEvent('preview-started', { detail: { id: short._id } }));
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(true);
    }, 1000);
  };

  const stopHover = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    setIsHovered(false);
  };

  useEffect(() => {
    const handlePreviewStarted = (e: any) => {
      if (e.detail.id !== short._id) {
        stopHover();
      }
    };
    window.addEventListener('preview-started', handlePreviewStarted);
    return () => window.removeEventListener('preview-started', handlePreviewStarted);
  }, [short._id]);

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

  return (
    <div
      className="relative group w-full aspect-[9/16] rounded-xl overflow-hidden cursor-pointer bg-black"
      onMouseEnter={startHover}
      onMouseLeave={stopHover}
    >
      {!isHovered ? (
        <img
          src={short.thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full">
          <PlyrPlayer
            thumbnail={short.thumbnail}
            source={short.source}
            subtitle={short.subtitle}
            onViewTracked={() => increaseViews(short._id)}
            className="w-full h-full"
            playerRef={playerRef}
            controls={[]}
            muted={true}
            disableStorage={true}
          />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none flex flex-col justify-end">
        <p className="font-semibold text-[15px] text-white leading-snug line-clamp-2 drop-shadow-md">
          {short.title}
        </p>
        <div className="text-[13px] text-gray-200 mt-1 drop-shadow-md">
          {`${short.views} views`}
        </div>
      </div>
    </div>
  );
}
