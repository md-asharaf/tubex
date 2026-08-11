import { PlyrPlayer } from "@/components/root/video-player";
import {
  EllipsisVertical,
  MessageSquareText,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Fullscreen,
  Loader2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Search,
  MoreVertical,
  Repeat,
  Tv,
  Radio,
  Focus,
  Music
} from "lucide-react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { AvatarImg } from "@/components/root/avatar-image";
import { useMutation, useQuery } from "@tanstack/react-query";
import { shortService } from "@/services/short";
import { commentService } from "@/services/comment";
import { subService } from "@/services/subscription";
import { userService } from "@/services/user";
import { IShortData, IComment } from "@/interfaces";
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
import { queryClient } from "@/lib/query-client";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveModal } from "@/components/root/modals/responsive-modal";

const PreviewShort = ({ id }: { id: string }) => {
  const { data: short } = useQuery({
    queryKey: ["short", id],
    queryFn: async (): Promise<IShortData> => {
      const data = await shortService.singleShort(id);
      return data.short;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  if (!short) return <div className="w-full h-full bg-black animate-pulse" />;

  return (
    <div className="w-full h-full bg-black">
      <img src={short.thumbnail} alt="" className="w-full h-full object-contain" />
    </div>
  );
};

export const Short = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { id: shortId } = useParams();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(100);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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
  const { data: topComment } = useQuery({
    queryKey: ["top-comment", shortId],
    queryFn: async (): Promise<IComment | null> => {
      const data = await commentService.getComments(shortId as string, 1, "short", "All", userId);
      return data?.comments?.docs?.length > 0 ? data.comments.docs[0] : null;
    },
    enabled: !!shortId,
  });

  useEffect(() => {
    const locationState = location.state as { commentId?: string, replyId?: string };
    if (locationState?.commentId || locationState?.replyId) {
      dispatch(setOpenCard("comments"));
    }
  }, [location.state, dispatch]);

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
      queryClient.setQueryData(
        ["is-liked", shortId],
        (prevData: boolean) => !prevData
      );
    },
  });

  const { mutate: incrementViews } = useMutation({
    mutationFn: async ({ shortId }: { shortId: string }) =>
      await shortService.incrementViews(shortId),
  });

  const { mutate: addToWatchHistory } = useMutation({
    mutationFn: async () => {
      await userService.addToWatchHistory(shortId as string, "short");
    },
  });

  const onViewTracked = () => {
    incrementViews({ shortId: shortId as string });
    if (!userId) return;
    addToWatchHistory();
  };

  const enterFullscreen = () => {
    if (playerRef.current) {
      playerRef.current.fullscreen.enter();
    }
  };
  const togglePlayPause = (e?: React.MouseEvent) => {
    if (e) {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.plyr__controls') || target.closest('a')) {
        return;
      }
    }
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
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientY;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientY;
    if (touchStartRef.current !== null) {
      const diff = e.targetTouches[0].clientY - touchStartRef.current;
      setDragOffset(diff);
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    if (touchStartRef.current === null) {
      setDragOffset(0);
      return;
    }

    if (touchEndRef.current === null) {
      touchStartRef.current = null;
      setDragOffset(0);
      return;
    }

    const distance = touchStartRef.current - touchEndRef.current;
    if (Math.abs(distance) < 10) {
      touchStartRef.current = null;
      touchEndRef.current = null;
      setDragOffset(0);
      return;
    }

    const minSwipeDistance = 75;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe && short.next) {
      setDragOffset(-window.innerHeight);
      setTimeout(() => {
        navigate(`/short/${short.next}`, { replace: true });
        setDragOffset(0);
      }, 300);
    } else if (isDownSwipe && short.prev) {
      setDragOffset(window.innerHeight);
      setTimeout(() => {
        navigate(`/short/${short.prev}`, { replace: true });
        setDragOffset(0);
      }, 300);
    } else {
      setDragOffset(0);
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const lastWheelEventTime = useRef<number>(0);

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    // Debounce wheel events by 1000ms
    if (now - lastWheelEventTime.current < 1000) return;

    if (Math.abs(e.deltaY) < 20) return;

    if (e.deltaY > 0 && short.next) {
      lastWheelEventTime.current = now;
      navigate(`/short/${short.next}`, { replace: true });
    } else if (e.deltaY < 0 && short.prev) {
      lastWheelEventTime.current = now;
      navigate(`/short/${short.prev}`, { replace: true });
    }
  };

  if (isLoading || !short) {
    return (
      <div className="flex items-center justify-center w-full min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div
        className="relative w-full h-[calc(100dvh-56px)] bg-black overflow-hidden text-white font-sans touch-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={handleWheel}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `translateY(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {short.prev && (
            <div className="absolute bottom-[100%] left-0 w-full h-full">
              <PreviewShort id={short.prev} />
            </div>
          )}

          {/* Video Player */}
          <div className="absolute inset-0 z-0" onClick={togglePlayPause}>
            <PlyrPlayer
              thumbnail={short.thumbnail}
              key={shortId}
              minWatchTime={10}
              source={short.source}
              playerRef={playerRef}
              onViewTracked={onViewTracked}
              controls={[]}
              className="w-full h-full object-contain"
              subtitle={short.subtitle}
            />
          </div>

          {/* Top Overlay Gradient */}
          <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />

          {/* Bottom Overlay Gradient */}
          <div className="absolute bottom-0 w-full h-64 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 pointer-events-none" />

          {/* Top Header */}
          <div className="absolute top-0 left-0 w-full z-20 flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-1 rounded-full"
                  aria-label="Go back"
                >
                  <ArrowLeft size={24} className="text-white" />
                </button>
                {!isPlaying && (<h1 className="text-xl font-bold">Shorts</h1>)}
              </div>
              <div className="flex items-center space-x-5">
                {!isPlaying && (
                  <button>
                    {isMuted ? <VolumeX size={26} onClick={() => setIsMuted(false)} /> : <Volume2 size={26} onClick={() => setIsMuted(true)} />}
                  </button>
                )}
                <Search size={26} onClick={() => navigate("/search")} className="cursor-pointer" />
                <div onClick={() => setOpen(true)} className="cursor-pointer">
                  <MoreVertical size={26} />
                </div>
                <ResponsiveModal
                  title=""
                  open={open}
                  onOpenChange={setOpen}
                  className="w-full bg-background"
                >
                  <ShortPopoverContent shortId={short._id} playerRef={playerRef} />
                </ResponsiveModal>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="absolute bottom-8 right-2 z-20 flex flex-col items-center space-y-6">
            <button className="flex flex-col items-center" onClick={() => toggleLike()}>
              <ThumbsUp size={30} fill={isLiked ? "white" : "transparent"} strokeWidth={1.5} />
              <span className="text-xs mt-1 font-medium">{likesCount || 0}</span>
            </button>
            <button className="flex flex-col items-center" onClick={() => dispatch(setOpenCard("comments"))}>
              <MessageSquareText size={30} strokeWidth={1.5} />
              <span className="text-xs mt-1 font-medium">{commentsCount || "0"}</span>
            </button>
            <button className="flex flex-col items-center" onClick={() => dispatch(setShareModalData({ open: true, id: shortId, type: "short" }))}>
              <Share2 size={30} strokeWidth={1.5} />
              <span className="text-xs mt-1 font-medium">Share</span>
            </button>
          </div>

          {/* Bottom Info Area */}
          <div className="absolute bottom-8 left-4 right-16 z-20 flex flex-col items-start space-y-3">
            {/* Top Comment Pill */}
            {topComment && (
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[13px] max-w-[85%] flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                  <AvatarImg fullname={topComment.creator.fullname} avatar={topComment.creator.avatar} />
                </div>
                <span className="truncate text-white/90">{topComment.content}</span>
              </div>
            )}

            {/* Channel Info */}
            <div className="flex items-center space-x-2 w-full mt-2">
              <Link to={`/channel/${short.creator.username}`} className="flex items-center space-x-2 shrink-0">
                <AvatarImg className="w-9 h-9 rounded-full" fullname={short.creator.fullname} avatar={short.creator.avatar} />
                <span className="font-bold text-sm tracking-wide">@{short.creator.username}</span>
              </Link>
              {userId !== short.creator._id && (
                <button
                  className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold"
                  onClick={() => toggleSubscription()}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              )}
            </div>

            {/* Title */}
            <p className="text-sm font-medium line-clamp-2 w-full pr-4">{short.title}</p>
          </div>

          {short.next && (
            <div className="absolute top-[100%] left-0 w-full h-full">
              <PreviewShort id={short.next} />
            </div>
          )}
        </div>

        {/* Comments Drawer */}
        {openedCard === "comments" && (
          <ShortComments
            shortId={short._id}
            playerRef={playerRef}
            creatorId={short.creator._id}
          />
        )}

        {/* Description Drawer */}
        {openedCard === "description" && (
          <DescriptionCard short={short} likes={likesCount} />
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-start justify-center w-full sm:px-4 py-4 overflow-x-hidden h-[calc(100dvh-120px)] sm:h-[calc(100dvh-80px)] sm:gap-20 lg:gap-24 xl:gap-28"
      onWheel={handleWheel}
    >
      <div className="flex relative rounded-lg shadow-lg group w-full sm:w-[450px] h-full justify-center">
        <div className="relative w-full h-full bg-black sm:rounded-lg overflow-hidden" onClick={togglePlayPause}>
          <PlyrPlayer
            thumbnail={short.thumbnail}
            key={shortId}
            minWatchTime={10}
            source={short.source}
            playerRef={playerRef}
            onViewTracked={onViewTracked}
            controls={[]}
            className="w-full h-full object-contain"
            subtitle={short.subtitle}
          />
          <div className="absolute top-4 justify-between h-11 w-full  px-2 group-hover:flex hidden">
            <div className="flex space-x-2">
              <button
                className="p-3 hover:bg-opacity-50 bg-opacity-60 bg-[#676D72] text-white rounded-full transition"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
              >
                {isMuted ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
                {isVolumeHovered && (
                  <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
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
        <div className="sm:ml-4">
          <DescriptionCard short={short} likes={likesCount} />
        </div>
      )}
      {openedCard === "comments" && (
        <>
          {isMobile && (
            <div
              className="fixed inset-0 bg-black/60 z-40 transition-opacity"
              onClick={() => dispatch(setOpenCard(""))}
            />
          )}
          <div className="fixed bottom-0 left-0 w-full z-50 sm:static sm:w-auto sm:h-full transition-transform duration-300 ease-in-out">
            <ShortComments
              shortId={short._id}
              playerRef={playerRef}
              creatorId={short.creator._id}
            />
          </div>
        </>
      )}
    </div>
  );
};
