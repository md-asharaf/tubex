import { useState } from "react";
import { formatDuration, formatViews } from "@/lib/utils";
import { PlyrPlayer } from "../video-player";
import { Volume2, VolumeX, Subtitles } from "lucide-react";
import { IVideoData } from "@/interfaces";
import { AvatarImg } from "@/components/root/avatar-image";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { ThreeDots } from "@/components/root/three-dots";

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
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative group flex flex-col gap-2 rounded-lg p-2"
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
                            <p className="absolute right-2 bottom-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                                {formatDuration(video.duration)}
                            </p>
                        </div>
                    ) : (
                        <div className="relative w-full h-full">
                            <PlyrPlayer
                                thumbnail={video.thumbnail}
                                key={video._id}
                                source={video.source}
                                subtitle={video.subtitle}
                                playerRef={playerRef}
                                controls={["progress"]}
                            />
                            {/* Click shield to allow navigation */}
                            <div className="absolute inset-0 z-10 cursor-pointer" />
                            <p className="absolute right-2 bottom-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                                {formatDuration(video.duration)}
                            </p>
                            {putExtraOptions && (
                                <div className="absolute top-3 right-3 flex flex-col gap-2">
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
                                        className={`bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-75 transition ${
                                            isCCEnabled
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
                        className={`font-semibold text-[16px] leading-snug line-clamp-2 ${
                            !video.creator && "text-sm"
                        }`}
                    >
                        {video.title}
                    </h3>
                    <div className="flex flex-col mt-1">
                        {video.creator && (
                            <span
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(`/channel/${video.creator.username}`);
                                }}
                                className="font-normal text-[14px] text-muted-foreground hover:text-foreground truncate cursor-pointer"
                            >
                                {video.creator.fullname}
                            </span>
                        )}
                        <p className="text-[14px] text-muted-foreground truncate">
                            {`${formatViews(
                                video.views
                            )} • ${formatDistanceToNowStrict(video.createdAt, {
                                addSuffix: true,
                            })}`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <ThreeDots videoId={video._id} />
                </button>
            </div>
        </div>
    );
};
