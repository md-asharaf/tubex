import { PlyrPlayer } from "@/components/root/video-player";
import {
    EllipsisVertical,
    MessageSquareText,
    Share2,
    ThumbsUp,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Fullscreen,
    Loader2,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AvatarImg } from "@/components/root/avatar-image";
import { useMutation, useQuery } from "@tanstack/react-query";
import { shortService } from "@/services/short";
import { commentService } from "@/services/comment";
import { subService } from "@/services/subscription";
import { IShortData } from "@/interfaces";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useState, useRef, useEffect } from "react";
import { likeService } from "@/services/like";
import { setShareModalData } from "@/store/reducers/ui";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { ShortPopoverContent } from "@/components/root/short/short-popover-content";
import { DescriptionCard } from "@/components/root/modals/description-card";
import { ShortComments } from "@/components/root/short/short-comments";
import { setOpenCard } from "@/store/reducers/short";
import { queryClient } from "@/main";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
export const Short = () => {
    const isMobile = useIsMobile();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id: shortId } = useParams();
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(100);
    const [isVolumeHovered, setIsVolumeHovered] = useState(false);
    const theme = useSelector((state: RootState) => state.theme.mode);
    const userId = useSelector((state: RootState) => state.auth.userData?._id);
    const openedCard = useSelector((state: RootState) => state.short.openCard);
    const playerRef = useRef(null);
    //queries
    const { data: short, isLoading } = useQuery({
        queryKey: ["short", shortId],
        queryFn: async (): Promise<IShortData> => {
            const data = await shortService.singleShort(shortId);
            return data.short;
        },
        enabled: !!shortId,
    });
    const { data: isLiked } = useQuery({
        queryKey: ["is-liked", shortId],
        queryFn: async (): Promise<boolean> => {
            const data = await likeService.isLiked(shortId, "short");
            return data.isLiked;
        },
        enabled: !!userId && !!short,
    });
    const { data: likesCount } = useQuery({
        queryKey: ["likes-count", shortId],
        queryFn: async (): Promise<number> => {
            const data = await likeService.likesCount(shortId, "short");
            return data.likesCount;
        },
        enabled: !!short,
    });
    const { data: commentsCount } = useQuery({
        queryKey: ["comments-count", shortId],
        queryFn: async (): Promise<number> => {
            const data = await commentService.commentsCount(shortId, "short");
            return data.commentsCount;
        },
        enabled: !!short,
    });
    const { data: isSubscribed } = useQuery({
        queryKey: ["subscribe", short?.creator?._id],
        queryFn: async (): Promise<boolean> => {
            const data = await subService.isChannelSubscribed(
                short.creator._id
            );
            return data.isSubscribed;
        },
        enabled: !!userId && !!short,
    });
    //mutations
    const { mutate: toggleSubscription } = useMutation({
        mutationFn: async () => {
            await subService.toggleSubscription(short.creator._id);
        },
        onMutate: () => {
            queryClient.cancelQueries({
                queryKey: ["is-subscribed", short?.creator?._id, userId],
            });
            queryClient.cancelQueries({
                queryKey: ["subscribers-count", short?.creator?._id],
            });
            queryClient.setQueryData(
                ["is-subscribed", short?.creator?._id, userId],
                (prevData: boolean) => !prevData
            );
            queryClient.setQueryData(
                ["subscribers-count", short?.creator?._id],
                (prevData: number) =>
                    isSubscribed ? prevData - 1 : prevData + 1
            );
        },
        onError: () => {
            queryClient.cancelQueries({
                queryKey: ["is-subscribed", short?.creator?._id, userId],
            });
            queryClient.cancelQueries({
                queryKey: ["subscribers-count", short?.creator?._id],
            });
            queryClient.setQueryData(
                ["is-subscribed", short?.creator?._id, userId],
                (prevData: boolean) => !prevData
            );
            queryClient.setQueryData(
                ["subscribers-count", short?.creator?._id],
                (prevData: number) =>
                    isSubscribed ? prevData - 1 : prevData + 1
            );
        },
        onSuccess: () => {
            if (isSubscribed) {
                toast.success('Subscription added')
            } else {
                toast.success('Subscription removed')
            }
        }
    });
    const { mutate: toggleLike } = useMutation({
        mutationFn: async () => {
            await likeService.toggleLike(shortId, "short");
        },
        onMutate: async (variables) => {
            queryClient.cancelQueries({
                queryKey: ["likes-count", shortId],
            });
            queryClient.cancelQueries({
                queryKey: ["is-liked", shortId],
            });
            queryClient.setQueryData(
                ["likes-count", shortId],
                (prevData: number) => (isLiked ? prevData - 1 : prevData + 1)
            );
            queryClient.setQueryData(
                ["is-liked", shortId],
                (prevData: boolean) => !prevData
            );
        },
        onError: () => {
            queryClient.cancelQueries({
                queryKey: ["likes-count", shortId],
            });
            queryClient.cancelQueries({
                queryKey: ["is-liked", shortId],
            });
            queryClient.setQueryData(
                ["likes-count", shortId],
                (prevData: number) => (isLiked ? prevData - 1 : prevData + 1)
            );
            queryClient.setQueryData(
                ["is-liked", shortId],
                (prevData: boolean) => !prevData
            );
        },
    });
    const enterFullscreen = () => {
        if (playerRef.current) {
            playerRef.current.fullscreen.enter();
        }
    };
    const togglePlayPause = () => {
        if (playerRef.current) {
            if (playerRef.current.paused) {
                playerRef.current.play();
                setIsPlaying(true);
            } else {
                playerRef.current.pause();
                setIsPlaying(false);
            }
        }
    };
    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.muted = isMuted;
            if (!isMuted && volume === 0) {
                setVolume(20);
            }
        }
    }, [isMuted]);
    useEffect(() => {
        if (playerRef.current) {
            if (volume === 0) {
                setIsMuted(true);
            }
            playerRef.current.volume = volume / 100;
        }
    }, [volume]);
    if (isLoading || !short) {
        return (
            <div className="flex items-center justify-center h-screen w-full">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }
    return (
        <div className="flex items-start justify-around w-full px-2 sm:px-4 py-4 overflow-x-hidden">
            <div className="flex relative rounded-lg shadow-lg group max-w-full">
                <div className="relative w-full sm:w-[512px]">
                    <PlyrPlayer
                        thumbnail={short.thumbnail}
                        key={shortId}
                        minWatchTime={10}
                        source={short.source}
                        playerRef={playerRef}
                        onViewTracked={() => { }}
                        controls={["play", "progress", "fullscreen"]}
                        className="aspect-[9/16]"
                        subtitle={short.subtitle}
                    />
                    <div className="absolute top-4 justify-between h-11 w-full  px-2 group-hover:flex hidden">
                        <div className="flex space-x-2">
                            <button
                                className="p-3 hover:bg-opacity-50 bg-opacity-60 bg-[#676D72] text-white rounded-full transition"
                                onClick={togglePlayPause}
                            >
                                {isPlaying ? (
                                    <Pause size={20} className="text-white" />
                                ) : (
                                    <Play size={20} className="text-white" />
                                )}
                            </button>
                            <button
                                className="flex space-x-2 p-3 hover:bg-opacity-50 bg-opacity-60 bg-[#676D72] text-white rounded-full transition items-center"
                                onMouseEnter={() => setIsVolumeHovered(true)}
                                onMouseLeave={() => setIsVolumeHovered(false)}
                            >
                                {isMuted ? (
                                    <VolumeX
                                        size={20}
                                        onClick={() => {
                                            setIsMuted(false);
                                        }}
                                    />
                                ) : (
                                    <Volume2
                                        size={20}
                                        onClick={() => {
                                            setIsMuted(true);
                                        }}
                                    />
                                )}
                                {isVolumeHovered && (
                                    <div className="relative flex items-center">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={volume}
                                            onChange={(e) => {
                                                setIsMuted(false);
                                                setVolume(
                                                    Number(e.target.value)
                                                );
                                            }}
                                            className="w-full cursor-pointer h-1 appearance-none"
                                        />
                                        <div
                                            className="absolute -top-1/2 -translate-y-1/2 left-0 w-full h-6 cursor-pointer"
                                            onClick={(e) => {
                                                const rect =
                                                    e.currentTarget.getBoundingClientRect();
                                                const clickX =
                                                    e.clientX - rect.left;
                                                const newValue = Math.round(
                                                    (clickX / rect.width) * 100
                                                );
                                                setVolume(newValue);
                                            }}
                                        />
                                    </div>
                                )}
                            </button>
                        </div>
                        {isMobile ? (
                            <Popover open={open} onOpenChange={setOpen} key={2}>
                                <PopoverTrigger className="p-3 bg-muted hover:bg-muted/80 rounded-full">
                                    <EllipsisVertical size={20} />
                                </PopoverTrigger>
                                <PopoverContent
                                    className="p-0 py-2 m-0 max-w-[200px]"
                                    align="start"
                                    onClick={() => {
                                        setOpen(false);
                                    }}
                                >
                                    <ShortPopoverContent
                                        shortId={short._id}
                                        playerRef={playerRef}
                                    />
                                </PopoverContent>
                            </Popover>
                        ) : (
                            <button
                                className="p-3 hover:bg-opacity-50 bg-opacity-60 bg-[#676D72] text-white rounded-full transition"
                                onClick={enterFullscreen}
                            >
                                <Fullscreen size={20} />
                            </button>
                        )}
                    </div>
                    <div className="text-white absolute bottom-10 left-4 space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                            <Link
                                to={`/channel/${short.creator.username}`}
                                className="flex items-center space-x-2"
                            >
                                <AvatarImg
                                    className="h-9 w-9"
                                    fullname={short.creator.fullname}
                                    avatar={short.creator.avatar}
                                />
                                <div className="font-bold">{`@${short.creator.username}`}</div>
                            </Link>

                            {userId !== short.creator._id && <button
                                className="rounded-full font-semibold bg-white text-black px-2 py-1"
                                onClick={() => toggleSubscription()}
                            >
                                {isSubscribed ? "Subscribed" : "Subscribe"}
                            </button>}
                        </div>
                        <div className="font-semibold">{short.title}</div>
                    </div>
                </div>
                <div className="absolute md:bottom-0 md:-right-14 bottom-16 right-2 flex flex-col sm:space-y-4 space-y-2 items-center">
                    <div
                        className="p-3 bg-muted hover:bg-muted/80 rounded-full"
                        onClick={() => toggleLike()}
                    >
                        <ThumbsUp
                            size={20}
                            fill={
                                isLiked
                                    ? theme == "dark"
                                        ? "white"
                                        : "black"
                                    : theme == "dark"
                                        ? "black"
                                        : "white"
                            }
                        />
                    </div>
                    {likesCount}
                    <div
                        className="p-3 bg-muted hover:bg-muted/80 rounded-full "
                        onClick={() => dispatch(setOpenCard("comments"))}
                    >
                        <MessageSquareText size={20} />
                    </div>
                    {commentsCount}
                    <div
                        className="p-3 bg-muted hover:bg-muted/80 rounded-full"
                        onClick={() =>
                            dispatch(
                                setShareModalData({
                                    open: true,
                                    id: shortId,
                                    type: "short",
                                })
                            )
                        }
                    >
                        <Share2 size={20} />
                    </div>
                    {!isMobile && (
                        <Popover open={open} onOpenChange={setOpen} key={1}>
                            <PopoverTrigger className="p-3 bg-muted hover:bg-muted/80 rounded-full">
                                <EllipsisVertical size={20} />
                            </PopoverTrigger>
                            <PopoverContent
                                className="p-0 py-2 m-0 max-w-[200px]"
                                align="start"
                                onClick={() => {
                                    setOpen(false);
                                }}
                            >
                                <ShortPopoverContent
                                    shortId={short._id}
                                    playerRef={playerRef}
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>
            <div className="space-y-2 absolute top-1/2 right-4 hidden md:block">
                {short.prev && (
                    <div
                        className="p-4 bg-muted rounded-full"
                        onClick={() =>
                            navigate(`/short/${short.prev}`, {
                                replace: true,
                            })
                        }
                    >
                        <ArrowUp size={20} />
                    </div>
                )}
                {short.next && (
                    <div
                        className="p-4 bg-muted rounded-full"
                        onClick={() =>
                            navigate(`/short/${short.next}`, {
                                replace: true,
                            })
                        }
                    >
                        <ArrowDown size={20} />{" "}
                    </div>
                )}
            </div>
            {openedCard === "description" && (
                <DescriptionCard short={short} likes={likesCount} />
            )}
            {openedCard === "comments" && (
                <ShortComments
                    shortId={short._id}
                    playerRef={playerRef}
                    creatorId={short.creator._id}
                />
            )}
        </div>
    );
};
