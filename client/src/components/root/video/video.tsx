import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { IVideoData } from "@/interfaces";
import { formatDistanceToNowStrict } from "date-fns";
import { videoService } from "@/services/video";
import { playlistService } from "@/services/playlist";
import { subService } from "@/services/subscription";
import { likeService } from "@/services/like";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { PlyrPlayer } from "@/components/root/video-player";
import { commentService } from "@/services/comment";
import { Bookmark, Share2, ThumbsUp } from "lucide-react";
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
      const data = await commentService.getComments(videoId as string, 1, "video", "All");
      return data.comments;
    },
    enabled: !!videoId && isMobile,
  });
  const topComment = topCommentData?.docs?.[0];

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

    if (target.closest('.plyr__controls')) {
      return;
    }

    if (playerRef.current) {
      if (playerRef.current.paused) {
        playerRef.current.play();
      } else {
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
          <div className="px-3 sm:px-0 flex flex-col space-y-2">
            <h1 className="font-bold text-xl">{video.title}</h1>
            <div className="flex justify-between flex-col sm:flex-row gap-y-2 sm:gap-0">
              <div className="flex gap-x-4 items-center justify-between sm:justify-normal">
                <Link
                  to={`/channel/${video.creator.username}`}
                  className="flex gap-x-4 items-center"
                >
                  <AvatarImg
                    className="h-12 w-12"
                    fullname={video.creator.fullname}
                    avatar={video.creator.avatar}
                  />
                  <div className="flex flex-col gap-y-1 items-start">
                    <div className="font-bold">
                      {video.creator.fullname}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {`${subscribersCount} subscribers`}
                    </div>
                  </div>
                </Link>

                <Button
                  variant={isSubscribed ? "secondary" : "default"}
                  className="rounded-full"
                  onClick={() => toggleSubscription()}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </Button>
              </div>
              {!isMobile && (
                <div className="flex sm:items-center justify-end gap-4 sm:gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => toggleVideoLike()}
                    className="rounded-full"
                  >
                    <ThumbsUp
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
                    {likesCount}
                  </Button>
                  <Button
                    className="rounded-full"
                    variant="secondary"
                    onClick={() =>
                      dispatch(
                        setShareModalData({
                          open: true,
                          id: videoId,
                          type: "video",
                        })
                      )
                    }
                  >
                    <Share2 />
                  </Button>
                  <div
                    onClick={() =>
                      dispatch(
                        setSaveToPlaylistDialog({
                          id: videoId,
                          open: true,
                        })
                      )
                    }
                  >
                    <Button
                      variant="secondary"
                      className="rounded-full"
                    >
                      <Bookmark /> Save
                    </Button>
                  </div>
                </div>
              )}
              {isMobile && (
                <div className="w-full mt-2">
                  <div className="flex flex-col gap-y-3">
                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between overflow-x-auto no-scrollbar pb-1">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          onClick={() => toggleVideoLike()}
                          className="rounded-full h-9 px-4 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 font-medium"
                        >
                          <ThumbsUp
                            size={18}
                            className="mr-2"
                            fill={isLiked ? (theme == "dark" ? "white" : "black") : "transparent"}
                          />
                          {likesCount}
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-full h-9 px-4 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 font-medium"
                          onClick={() => dispatch(setShareModalData({ open: true, id: videoId, type: "video" }))}
                        >
                          <Share2 size={18} className="mr-2" /> Share
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-full h-9 px-4 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 font-medium"
                          onClick={() => dispatch(setSaveToPlaylistDialog({ id: videoId, open: true }))}
                        >
                          <Bookmark size={18} className="mr-2" /> Save
                        </Button>
                      </div>
                    </div>

                    {/* Description Box */}
                    <div
                      className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 cursor-pointer transition-colors"
                      onClick={!isExpanded ? toggleExpanded : undefined}
                    >
                      <div className="flex items-center flex-wrap gap-x-2 text-sm font-bold text-foreground">
                        <span>{formatViews(video.views)}</span>
                        <span>{formatDistanceToNowStrict(new Date(video.createdAt), { addSuffix: true })}</span>
                        {!isExpanded && (
                          <span className="font-semibold text-foreground mt-0.5">...more</span>
                        )}
                      </div>
                      {isExpanded && (
                        <div className="mt-2 text-sm">
                          <p className="whitespace-pre-wrap">{video.description}</p>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 mt-2 font-bold hover:bg-transparent"
                            onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
                          >
                            Show less
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!isMobile && (
              <div className="px-4 py-2 shadow-md rounded-xl bg-[#F2F2F2] dark:bg-[#272727]">
                <div className="flex space-x-2 font-bold">
                  <div>{formatViews(video.views)}</div>
                  <div>
                    {formatDistanceToNowStrict(
                      new Date(video.createdAt),
                      { addSuffix: true }
                    )}
                  </div>
                </div>
                <div>
                  <p
                    className={`whitespace-pre-wrap ${!isExpanded ? "line-clamp-2" : ""
                      }`}
                  >
                    {video.description}
                  </p>
                  <Button
                    variant="ghost"
                    onClick={toggleExpanded}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </Button>
                </div>
              </div>
            )}
            {isMobile && (
              <div
                className="mt-2 w-full p-3 rounded-xl bg-[#F2F2F2] dark:bg-[#28292A] cursor-pointer"
                onClick={() => setIsMobileCommentsOpen(true)}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2 font-bold">
                    <span>Comments</span>
                    <span className="text-muted-foreground font-normal text-sm">{topCommentData?.totalDocs}</span>
                  </div>
                </div>
                {topComment && (
                  <div className="flex items-start gap-x-2 mt-1">
                    <AvatarImg
                      className="w-6 h-6 shrink-0 mt-0.5"
                      fullname={topComment.creator.fullname}
                      avatar={topComment.creator.avatar}
                    />
                    <div className="text-sm line-clamp-2 text-foreground">
                      {topComment.content}
                    </div>
                  </div>
                )}
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
      <div className="w-full xl:w-1/3 2xl:w-[30%] flex flex-col gap-y-4 sm:block">
        {recommendedVideos?.map((video) => (
          <Link
            to={`/video/${video._id}`}
            key={video._id}
            className="flex flex-col sm:flex-row justify-between mb-2 sm:mb-4 sm:mr-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 px-0 sm:px-4 lg:min-w-[300px] lg:max-w-[500px] w-full">
              <img
                src={video.thumbnail}
                className="w-full sm:w-44 sm:h-24 object-cover sm:rounded-lg aspect-video"
                loading="lazy"
              />
              <div className="flex gap-x-3 px-3 sm:px-0 pb-4 sm:pb-0">
                <div className="sm:hidden mt-0.5 shrink-0">
                  <AvatarImg
                    className="w-9 h-9"
                    avatar={video.creator?.avatar}
                    fullname={video.creator?.fullname}
                  />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <p className="font-bold line-clamp-2 overflow-hidden text-ellipsis sm:text-sm">
                    {video.title}
                  </p>
                  <div className="text-muted-foreground text-sm sm:text-xs mt-1">
                    {video.creator?.fullname} {isMobile ? "•" : ""} {isMobile && formatViews(video.views)} {isMobile ? "•" : ""} {isMobile && formatDistanceToNowStrict(new Date(video.createdAt), { addSuffix: true })}
                  </div>
                  {!isMobile && (
                    <div className="text-muted-foreground text-xs mt-1">
                      {`${formatViews(video.views)} • ${formatDistanceToNowStrict(
                        new Date(video.createdAt),
                        { addSuffix: true }
                      )}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden sm:block">
              <ThreeDots videoId={video._id} />
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
