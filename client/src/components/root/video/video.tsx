import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { IVideoData } from "@/interfaces";
import { getRelativeShortTime } from "@/lib/time";
import { videoService } from "@/services/video";
import { playlistService } from "@/services/playlist";
import { subService } from "@/services/subscription";
import { likeService } from "@/services/like";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { PlyrPlayer } from "@/components/root/video-player";
import { commentService } from "@/services/comment";
import { Bookmark, Share2, ThumbsUp, ThumbsDown, Sparkles, MoreHorizontal, Bell, ChevronDown } from "lucide-react";
import { userService } from "@/services/user";
import { ThreeDots } from "@/components/root/three-dots";
import { Loader2 } from "lucide-react";
import { formatViews } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { RootState } from "@/store/store";
import {
  setSaveToPlaylistDialog,
  setShareModalData,
  toggleMenu,
} from "@/store/reducers/ui";
import { AvatarImg } from "@/components/root/avatar-image";
import { VideoComments } from "@/components/root/video/video-comments";
import { queryClient } from "@/lib/query-client";
export const Video = () => {
  const theme = useSelector((state: RootState) => state.theme.mode);
  const dispatch = useDispatch();
  const playerRef = useRef(null);
  const [isMobileCommentsOpen, setIsMobileCommentsOpen] = useState(false);
  const { id: videoId } = useParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCommentIndex, setActiveCommentIndex] = useState(0);
  const userId = useSelector((state: RootState) => state.auth.userData?._id);
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const listId = searchParams.get("list");
  const shuffle = searchParams.get("shuffle") === "true";
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCommentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeCommentIndex) {
      setActiveCommentIndex(newIndex);
    }
  };

  const {
    data: video,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["video", videoId],
    queryFn: async (): Promise<IVideoData> => {
      const data = await videoService.singleVideo(videoId);
      return data.video;
    },
    enabled: !!videoId,
  });

  const { data: playlist } = useQuery({
    queryKey: ["playlist", listId],
    queryFn: async () => {
      const data = await playlistService.getPlaylistById(listId);
      return data.playlist;
    },
    enabled: !!listId,
  });

  const { data: isLiked } = useQuery({
    queryKey: ["is-liked", videoId],
    queryFn: async (): Promise<boolean> => {
      const data = await likeService.isLiked(videoId, "video");
      return data.isLiked;
    },
    enabled: !!userId && !!videoId,
  });
  const { data: likesCount } = useQuery({
    queryKey: ["likes-count", videoId],
    queryFn: async (): Promise<number> => {
      const data = await likeService.likesCount(videoId, "video");
      return data.likesCount;
    },
    enabled: !!videoId,
  });
  const { data: isSubscribed } = useQuery({
    queryKey: ["is-subscribed", video?.creator?._id, userId],
    queryFn: async (): Promise<boolean> => {
      const data = await subService.isChannelSubscribed(
        video.creator._id
      );
      return data.isSubscribed;
    },
    enabled: !!video && !!userId,
  });

  const { data: topCommentData } = useQuery({
    queryKey: ["top-comment", videoId],
    queryFn: async () => {
      const data = await commentService.getComments(videoId as string, 1, "video", "All", undefined, 2);
      return data.comments;
    },
    enabled: !!videoId && isMobile,
  });

  const { data: subscribersCount } = useQuery({
    queryKey: ["subscribers-count", video?.creator?._id],
    queryFn: async (): Promise<number> => {
      const data = await subService.getSubscribersCount(
        video.creator._id
      );
      return data.subscribersCount;
    },
    enabled: !!video,
  });

  const { data: videoPages } = useInfiniteQuery({
    queryKey: ["recommended-videos", userId, videoId],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await videoService.recommendedVideos(
        pageParam,
        "All",
        videoId,
        userId
      );
      return data.recommendations;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length == 12 ? allPages.length + 1 : null,
    enabled: !!videoId,
  });
  const recommendedVideos = videoPages?.pages.flatMap((page) => page);
  const { mutate: incrementViews } = useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) =>
      await videoService.incrementViews(videoId),
  });

  const { mutate: toggleVideoLike } = useMutation({
    mutationFn: async () => {
      await likeService.toggleLike(videoId, "video");
    },
    onMutate: () => {
      queryClient.cancelQueries({ queryKey: ["is-liked", videoId] });
      queryClient.cancelQueries({ queryKey: ["likes-count", videoId] });
      queryClient.setQueryData(
        ["is-liked", videoId],
        (prevData: boolean) => !prevData
      );
      queryClient.setQueryData(
        ["likes-count", videoId],
        (prevData: number) => (isLiked ? prevData - 1 : prevData + 1)
      );
    },
    onError: (error) => {
      queryClient.cancelQueries({ queryKey: ["is-liked", videoId] });
      queryClient.cancelQueries({ queryKey: ["likes-count", videoId] });
      queryClient.setQueryData(
        ["is-liked", videoId],
        (prevData: boolean) => !prevData
      );
      queryClient.setQueryData(
        ["likes-count", videoId],
        (prevData: number) => (isLiked ? prevData - 1 : prevData + 1)
      );
    },
  });

  const { mutate: toggleSubscription } = useMutation({
    mutationFn: async () => {
      await subService.toggleSubscription(video.creator._id);
    },
    onMutate: () => {
      queryClient.cancelQueries({
        queryKey: ["is-subscribed", video?.creator?._id, userId],
      });
      queryClient.cancelQueries({
        queryKey: ["subscribers-count", video?.creator?._id],
      });
      queryClient.setQueryData(
        ["is-subscribed", video?.creator?._id, userId],
        (prevData: boolean) => !prevData
      );
      queryClient.setQueryData(
        ["subscribers-count", video?.creator?._id],
        (prevData: number) =>
          isSubscribed ? prevData - 1 : prevData + 1
      );
    },
    onError: () => {
      queryClient.cancelQueries({
        queryKey: ["is-subscribed", video?.creator?._id, userId],
      });
      queryClient.cancelQueries({
        queryKey: ["subscribers-count", video?.creator?._id],
      });
      queryClient.setQueryData(
        ["is-subscribed", video?.creator?._id, userId],
        (prevData: boolean) => !prevData
      );
      queryClient.setQueryData(
        ["subscribers-count", video?.creator?._id],
        (prevData: number) =>
          isSubscribed ? prevData - 1 : prevData + 1
      );
    },
  });

  const { mutate: addToWatchHistory } = useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      await userService.addToWatchHistory(videoId, "video");
    },
  });
  const onViewTracked = () => {
    incrementViews({ videoId });
    if (!userId) return;
    addToWatchHistory({ videoId });
  };

  const handleVideoEnd = () => {
    if (playlist && listId) {
      if (shuffle) {
        const randomIndex = Math.floor(Math.random() * playlist.videos.length);
        navigate(`/video/${playlist.videos[randomIndex]._id}?list=${listId}&shuffle=true`);
      } else {
        const currentIndex = playlist.videos.findIndex((v) => v._id === videoId);
        if (currentIndex !== -1 && currentIndex < playlist.videos.length - 1) {
          const nextVideoId = playlist.videos[currentIndex + 1]._id;
          navigate(`/video/${nextVideoId}?list=${listId}`);
        }
      }
    }
  };

  useEffect(() => {
    dispatch(toggleMenu(false));
  }, []);

  useEffect(() => {
    const locationState = location.state as { commentId?: string, replyId?: string };
    if (locationState?.commentId || locationState?.replyId) {
      if (isMobile) {
        setIsMobileCommentsOpen(true);
      }
    }
  }, [location.state, isMobile]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.muted = true;
    }
  }, [playerRef]);
  if (isError) return <div>Error: {error?.message}</div>;
  if (isLoading) return (
    <div className="flex justify-center items-center w-full min-h-[50vh]">
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
    </div>
  );
  const handleVideoClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    if (target.closest('.plyr__controls') || target.closest('button, a')) {
      return;
    }

    if (playerRef.current) {
      if (playerRef.current.paused) {
        playerRef.current.play();
      } else {
        const plyrContainer = target.closest('.plyr');
        if (plyrContainer) {
          const isControlsHidden = plyrContainer.classList.contains('plyr--hide-controls');
          if (isControlsHidden) {
            return;
          }
        }
        playerRef.current.pause();
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4 xl:flex-row w-full">
      <div className="space-y-4 w-full xl:w-2/3 2xl:w-[70%]">
        <div className="flex flex-col space-y-2 sm:px-2">
          <div onClickCapture={handleVideoClick}>
            <PlyrPlayer
              key={video._id}
              thumbnail={video.thumbnail}
              thumbnailPreviews={video.thumbnailPreviews}
              source={video.source}
              subtitle={video.subtitle}
              controls={[
                "play",
                "progress",
                "current-time",
                "mute",
                "volume",
                "settings",
                "fullscreen",
              ]}
              playerRef={playerRef}
              onViewTracked={onViewTracked}
              onEnded={handleVideoEnd}
              minWatchTime={
                parseInt(video.duration) < 15
                  ? parseInt(video.duration)
                  : 15
              }
              className="aspect-video"
              trackProgressId={video._id}
              userId={userId}
            />
          </div>
          <div className="px-3 sm:px-0 flex flex-col mt-2 sm:mt-3">
            <h1 className="font-bold text-[18px] sm:text-xl line-clamp-2 order-1 leading-snug">{video.title}</h1>

            {/* Description Box / Inline Text (Order 2 on Mobile, Order 3 on Desktop) */}
            <div
              className={`order-2 sm:order-3 w-full cursor-pointer transition-colors mt-1 sm:mt-3 ${isExpanded
                  ? "p-3 rounded-xl bg-black/5 dark:bg-[#28292A] sm:bg-black/5 sm:dark:bg-white/10"
                  : "p-0 rounded-none bg-transparent sm:p-3 sm:rounded-xl sm:bg-black/5 sm:dark:bg-white/10 sm:hover:bg-black/10 sm:dark:hover:bg-white/20"
                }`}
              onClick={!isExpanded ? toggleExpanded : undefined}
            >
              <div className="flex items-center flex-wrap gap-x-1 sm:gap-x-2 text-[12px] sm:text-[14px] font-normal sm:font-bold text-muted-foreground sm:text-foreground">
                <span className="sm:hidden">@{video.creator.username}</span>
                <span className="sm:hidden">{likesCount} likes</span>
                <span className="sm:font-semibold">{formatViews(video.views)}</span>
                <span>{getRelativeShortTime(new Date(video.createdAt))}</span>
                {!isExpanded && (
                  <span className="font-bold text-foreground mt-0.5 ml-1">...more</span>
                )}
              </div>
              {isExpanded && (
                <div className="mt-2 text-[13px] sm:text-[14px]">
                  <p className="whitespace-pre-wrap">{video.description}</p>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 mt-4 font-bold hover:bg-transparent"
                    onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
                  >
                    Show less
                  </Button>
                </div>
              )}
            </div>

            {/* Channel and Actions Row (Order 3 on Mobile, Order 2 on Desktop) */}
            <div className="order-3 sm:order-2 flex flex-row justify-between items-center w-full mt-3 sm:mt-3">
              <div className="flex items-center">
                <Link
                  to={`/channel/${video.creator.username}`}
                  className="flex gap-x-3 items-center shrink-0"
                >
                  <AvatarImg
                    className="h-9 w-9 sm:h-11 sm:w-11"
                    fullname={video.creator.fullname}
                    avatar={video.creator.avatar}
                  />
                  <div className="hidden sm:flex flex-col items-start justify-center">
                    <div className="font-bold text-[15px] sm:text-[16px] leading-tight">
                      {video.creator.fullname}
                    </div>
                    <div className="text-muted-foreground text-[12px] sm:text-[13px]">
                      {`${subscribersCount} subscribers`}
                    </div>
                  </div>
                </Link>
                <div className="ml-2 sm:ml-4 flex items-center">
                  <Button
                    variant={isSubscribed ? "secondary" : "default"}
                    className={`rounded-full font-semibold px-3 sm:px-4 h-8 sm:h-9 ${!isSubscribed ? 'bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90' : 'bg-black/5 dark:bg-white/10'}`}
                    onClick={() => toggleSubscription()}
                  >
                    <span className="hidden sm:inline">{isSubscribed ? "Subscribed" : "Subscribe"}</span>
                    <span className="sm:hidden flex items-center gap-x-1">
                      {isSubscribed ? <Bell size={16} /> : null}
                      <span className="text-[13px]">{isSubscribed ? null : "Subscribe"}</span>
                      {isSubscribed ? <ChevronDown size={14} /> : null}
                    </span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-end overflow-x-auto no-scrollbar shrink-0 ml-2">
                <div className="flex items-center space-x-0.5 sm:space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => toggleVideoLike()}
                    className="rounded-full h-10 w-10 p-0 sm:h-9 sm:w-auto sm:px-4 sm:bg-black/5 sm:dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 font-medium whitespace-nowrap shrink-0"
                  >
                    <ThumbsUp
                      size={20}
                      className="sm:mr-2"
                      fill={isLiked ? (theme == "dark" ? "white" : "black") : "transparent"}
                    />
                    <span className="hidden sm:inline">{likesCount}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full h-10 w-10 p-0 sm:h-9 sm:w-auto sm:px-4 sm:bg-black/5 sm:dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 font-medium whitespace-nowrap shrink-0"
                    onClick={() => dispatch(setShareModalData({ open: true, id: videoId, type: "video" }))}
                  >
                    <Share2 size={20} className="sm:mr-2" /> <span className="hidden sm:inline">Share</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full h-10 w-10 p-0 sm:h-9 sm:w-auto sm:px-4 sm:bg-black/5 sm:dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 font-medium whitespace-nowrap shrink-0"
                    onClick={() => dispatch(setSaveToPlaylistDialog({ id: videoId, open: true }))}
                  >
                    <Bookmark size={20} className="sm:mr-2" /> <span className="hidden sm:inline">Save</span>
                  </Button>
                </div>
              </div>
            </div>
            {isMobile && (
              <div
                className="order-4 mt-4 w-full p-3 rounded-xl bg-black/5 dark:bg-[#28292A] cursor-pointer"
                onClick={() => setIsMobileCommentsOpen(true)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2 font-bold text-[14px]">
                    <span>Comments</span>
                    <span className="text-muted-foreground font-normal text-[12px]">{topCommentData?.totalDocs || 0}</span>
                  </div>
                  {/* Indicators */}
                  {(topCommentData?.docs?.length || 0) > 1 && (
                    <div className="flex gap-x-1">
                      {topCommentData?.docs?.slice(0, 2).map((_: any, idx: number) => (
                        <div
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full transition-colors ${idx === activeCommentIndex
                              ? "bg-foreground"
                              : "bg-muted-foreground/50"
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {/* Carousel Container */}
                <div
                  className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
                  onScroll={handleCommentScroll}
                >
                  {topCommentData?.docs?.slice(0, 2).map((comment: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-x-2 shrink-0 w-full snap-center"
                    >
                      <AvatarImg
                        className="w-6 h-6 shrink-0 mt-0.5"
                        fullname={comment.creator.fullname}
                        avatar={comment.creator.avatar}
                      />
                      <div className="text-[13px] line-clamp-2 text-foreground leading-snug w-[calc(100%-2rem)]">
                        {comment.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="hidden xl:block">
          <VideoComments
            creatorId={video.creator._id}
            videoId={video._id}
            playerRef={playerRef}
          />
        </div>
      </div>
      <div className="w-full xl:w-1/3 2xl:w-[30%] flex flex-col gap-y-3 sm:gap-y-2 mt-4 xl:mt-0 xl:pl-4">
        {recommendedVideos?.map((video) => (
          <Link
            to={`/video/${video._id}`}
            key={video._id}
            className="flex flex-col sm:flex-row gap-2 w-full group cursor-pointer"
          >
            <div className="relative shrink-0">
              <img
                src={video.thumbnail}
                className="w-full sm:w-40 sm:h-[90px] object-cover sm:rounded-xl aspect-video"
                loading="lazy"
              />
            </div>
            <div className="flex gap-x-3 px-3 sm:px-0 pb-3 sm:pb-0 pt-1 sm:pt-0 w-full overflow-hidden">
              <div className="sm:hidden mt-0.5 shrink-0">
                <AvatarImg
                  className="w-9 h-9"
                  avatar={video.creator?.avatar}
                  fullname={video.creator?.fullname}
                />
              </div>
              <div className="flex flex-col flex-1 overflow-hidden pr-2 sm:pr-6">
                <p className="font-semibold leading-tight text-[15px] sm:text-[14px] line-clamp-2 text-foreground transition-colors">
                  {video.title}
                </p>
                <div className="flex flex-wrap items-center mt-1 sm:mt-0.5 text-[13px] sm:text-[12px] text-muted-foreground leading-snug">
                  {video.creator && (
                    <>
                      <span className="truncate hover:text-foreground">{video.creator.fullname}</span>
                      <span className="mx-1.5">•</span>
                    </>
                  )}
                  <span className="truncate">
                    {`${formatViews(video.views)} • ${getRelativeShortTime(new Date(video.createdAt))}`}
                  </span>
                </div>
              </div>
              <div className="shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <ThreeDots videoId={video._id} />
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="xl:hidden">
        <VideoComments
          videoId={videoId}
          playerRef={playerRef}
          creatorId={video.creator._id}
          isDrawer={true}
          open={isMobileCommentsOpen}
          onOpenChange={(open: boolean) => setIsMobileCommentsOpen(open)}
        />
      </div>
    </div>
  );
};

export default Video;
