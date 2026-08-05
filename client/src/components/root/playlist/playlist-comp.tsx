import { Link, useNavigate } from "react-router-dom";
import { IShortData, IVideoData } from "@/interfaces";
import { formatDistanceToNowStrict } from "date-fns";
import { Button } from "@/components/ui/button";
import { formatDuration, formatViews } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { ThreeDots } from "@/components/root/three-dots";
import { useMutation } from "@tanstack/react-query";
import { playlistService } from "@/services/playlist";
import { likeService } from "@/services/like";
import { toast } from "sonner";
import ColorThief from "colorthief";
import { Play, Shuffle } from "lucide-react";

interface Props {
    playlist: {
        _id?: string;
        name: string;
        creator: string;
        updatedAt: Date;
        totalViews: number;
        videos: Array<IVideoData>;
        shorts: Array<IShortData>;
        description: string;
    };
    refetch?: () => void;
}

export const PlaylistComp: React.FC<Props> = ({ playlist }) => {
    const [background, setBackground] = useState<string>("rgb(200, 200, 200)");
    const navigate = useNavigate();

    useEffect(() => {
        if (playlist.videos.length === 0) return;
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = playlist.videos[0].thumbnail;

        image.onload = () => {
            const colorThief = new ColorThief();
            try {
                const dominantColor = colorThief.getColor(image);
                if (dominantColor) {
                    const rgbColor = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;
                    setBackground(rgbColor);
                }
            } catch (error) {
                console.error("Error extracting colors:", error);
            }
        };
    }, [playlist.videos]);

    const { mutate: remove } = useMutation({
        mutationFn: async ({ playlistId, videoId }: { playlistId: string; videoId: string }) => {
            await playlistService.removeFromPlaylist(playlistId, videoId, "video");
        },
        onMutate: ({ videoId }) => {
            toast.success(`Removed from ${playlist.name}`);
            let video;
            let index;
            playlist.videos = playlist.videos.filter((v, i) => {
                if (v._id !== videoId) return true;
                video = v;
                index = i;
                return false;
            });
            return { video, index };
        },
        onError: ({ message }, _, { index, video }) => {
            toast.error(message);
            playlist.videos.splice(index, 0, video);
        },
    });

    const { mutate: toggleLike } = useMutation({
        mutationFn: async (videoId: string) => {
            await likeService.toggleLike(videoId, "video");
        },
        onMutate: (videoId) => {
            toast.success(`Removed from liked videos`);
            let video;
            let index;
            playlist.videos = playlist.videos.filter((v, i) => {
                if (v._id !== videoId) return true;
                video = v;
                index = i;
                return false;
            });
            return { video, index };
        },
        onError: ({ message }, _, { index, video }) => {
            toast.error(message);
            playlist.videos.splice(index, 0, video);
        },
    });

    const handlePlayAll = () => {
        if (playlist.videos.length > 0) {
            navigate(`/video/${playlist.videos[0]._id}?list=${playlist._id}`);
        }
    };

    const handleShuffle = () => {
        if (playlist.videos.length > 0) {
            const randomIndex = Math.floor(Math.random() * playlist.videos.length);
            navigate(`/video/${playlist.videos[randomIndex]._id}?list=${playlist._id}&shuffle=true`);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-64px)] relative dark:text-white">
            {/* Desktop Sticky Panel / Mobile Header */}
            <div className="relative w-full lg:w-[360px] xl:w-[400px] shrink-0 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] overflow-hidden lg:rounded-xl">
                <div 
                    className="absolute inset-0 z-0"
                    style={{
                        background: `linear-gradient(to bottom, ${background} 0%, transparent 100%)`,
                        opacity: 0.8
                    }}
                />
                
                <div className="relative z-10 flex flex-col p-6 h-full overflow-y-auto no-scrollbar">
                    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg mb-6 shrink-0">
                        {playlist.videos.length > 0 ? (
                            <img
                                src={playlist.videos[0].thumbnail}
                                className="w-full h-full object-cover"
                                alt="Playlist thumbnail"
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                <span className="text-zinc-500">No videos</span>
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 break-words">
                        {playlist.name}
                    </h1>

                    <div className="flex flex-col gap-1 mb-6">
                        <p className="font-semibold text-foreground text-[15px]">{playlist.creator}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {playlist.name === "Watch Later" ? "Private" : "Public"} • {playlist.videos.length} videos • {formatViews(playlist.totalViews)}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Last updated on {new Date(playlist.updatedAt).toDateString()}
                        </p>
                    </div>

                    <div className="flex gap-2 w-full mb-6">
                        <Button 
                            onClick={handlePlayAll}
                            disabled={playlist.videos.length === 0}
                            className="flex-1 bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold"
                        >
                            <Play className="w-4 h-4 mr-2 fill-current" /> Play all
                        </Button>
                        <Button 
                            onClick={handleShuffle}
                            disabled={playlist.videos.length === 0}
                            variant="secondary"
                            className="flex-1 rounded-full font-semibold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20"
                        >
                            <Shuffle className="w-4 h-4 mr-2" /> Shuffle
                        </Button>
                    </div>

                    {playlist.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3 hover:line-clamp-none transition-all">
                            {playlist.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Videos List */}
            <div className="flex-1 relative z-10 px-4 sm:px-6 py-6 lg:pl-10">
                <div className="flex flex-col gap-2 max-w-4xl mx-auto">
                    {playlist.videos?.map((video, index) => (
                        <Link 
                            to={`/video/${video._id}?list=${playlist._id}`} 
                            key={video._id}
                            className="block"
                        >
                            <div className="group flex items-start gap-3 sm:gap-4 p-2 sm:p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition duration-200">
                                <div className="hidden sm:flex w-6 h-full items-center justify-center shrink-0 mt-[34px]">
                                    <span className="text-sm font-medium text-muted-foreground group-hover:hidden">
                                        {index + 1}
                                    </span>
                                    <Play className="w-4 h-4 text-foreground hidden group-hover:block" />
                                </div>

                                <div className="relative w-36 sm:w-40 aspect-video shrink-0 rounded-lg overflow-hidden bg-muted">
                                    <img
                                        src={video.thumbnail}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        alt={video.title}
                                    />
                                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white px-1.5 py-0.5 text-xs font-medium rounded">
                                        {formatDuration(video.duration)}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-start">
                                    <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2 leading-tight mb-1">
                                        {video.title}
                                    </h3>
                                    <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                        <span>{video.creator.fullname}</span>
                                        <span className="hidden sm:inline mx-1.5">•</span>
                                        <span>
                                            {formatViews(video.views)} • {formatDistanceToNowStrict(new Date(video.createdAt)).replace("about", "")} ago
                                        </span>
                                    </div>
                                </div>

                                <div className="shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <ThreeDots
                                        videoId={video._id}
                                        task={
                                            playlist.name === "Watch Later"
                                                ? null
                                                : {
                                                      title: `Remove from ${playlist.name}`,
                                                      handler: () =>
                                                          playlist._id
                                                              ? remove({
                                                                    playlistId: playlist._id,
                                                                    videoId: video._id,
                                                                })
                                                              : toggleLike(video._id),
                                                  }
                                        }
                                    />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};
