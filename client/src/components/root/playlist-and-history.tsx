import { useSelector } from "react-redux";
import { IShortData, IVideoData, Playlist } from "@/interfaces";
import { useQuery } from "@tanstack/react-query";
import { playlistService } from "@/services/playlist";
import { subService } from "@/services/subscription";
import { Loader2, ChevronRight, ThumbsUp, ListVideo, Search, Settings } from "lucide-react";
import { ImYoutube } from "react-icons/im";
import { useNavigate } from "react-router-dom";
import { Notifications } from "@/components/root/notifications";
import { userService } from "@/services/user";
import { videoService } from "@/services/video";
import { RootState } from "@/store/store";
import { Library } from "@/components/root/library";
import { ThreeDots } from "@/components/root/three-dots";
import { AvatarImg } from "@/components/root/avatar-image";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

export const PlaylistNhistory = () => {
  const userData = useSelector((state: RootState) => state.auth.userData);

  const { data: subscriberCount } = useQuery({
    queryKey: ["subscriberCount", userData?._id],
    queryFn: async (): Promise<number> => {
      const data = await subService.getSubscribersCount(userData?._id);
      return data.subscribersCount;
    },
    enabled: !!userData,
  });

  const { data: watchHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["watch-history", userData?._id],
    queryFn: async (): Promise<{
      videos: IVideoData[];
      shorts: IShortData[];
    }> => {
      const data = await userService.getWatchHistory();
      return data.watchHistory;
    },
    enabled: !!userData,
  });

  const navigate = useNavigate();

  const { data: playlists, isLoading: loadingPlaylists } = useQuery({
    queryKey: ["playlists", userData?._id],
    queryFn: async (): Promise<Playlist[]> => {
      const data = await playlistService.getAllPlaylists(userData?.username);
      return data.playlists;
    },
    enabled: !!userData?._id,
  });

  const { data: watchLater, isLoading: loadingWatchLater } = useQuery({
    queryKey: ["watch-later", userData?._id],
    queryFn: async (): Promise<{
      videos: IVideoData[];
      shorts: IShortData[];
    }> => {
      const data = await userService.getWatchLater();
      return data.watchLater;
    },
    enabled: !!userData,
  });

  const { data: likedVideos, isLoading: loadingLikedVideos } = useQuery({
    queryKey: ["liked-videos", userData?._id],
    queryFn: async (): Promise<IVideoData[]> => {
      const data = await videoService.likedVideos();
      return data.likedVideos;
    },
    enabled: !!userData?._id,
  });

  if (
    loadingHistory ||
    loadingPlaylists ||
    loadingWatchLater ||
    loadingLikedVideos
  ) {
    return (
      <div className="flex justify-center items-center w-full min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Top Header */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2 sticky top-0 bg-white dark:bg-[#0F0F0F] z-10">
        <button
          className="flex items-center hover:bg-transparent text-lg space-x-1"
          onClick={() => (window.location.href = "/")}
        >
          <ImYoutube color="red" className="text-2xl" />
          <h1 className="font-bold text-lg tracking-tight">TubeX</h1>
        </button>
        <div className="flex items-center space-x-2">
          <Notifications />
          <button className="p-2 rounded-full hover:bg-muted" onClick={() => navigate('/search')}>
            <Search size={22} />
          </button>
          <button className="p-2 rounded-full hover:bg-muted" onClick={() => navigate('/settings')}>
            <Settings size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Profile Header */}
      <div className="sm:hidden flex flex-col px-4 pt-2 pb-4">
        <div className="flex items-center space-x-4 mb-4">
          <AvatarImg
            avatar={userData?.avatar}
            fullname={userData?.fullname}
            className="rounded-full h-[72px] w-[72px] shrink-0 object-cover"
          />
          <div className="flex flex-col">
            <div className="font-bold text-2xl">{userData?.fullname}</div>
            <div className="text-sm text-muted-foreground">{`@${userData?.username}`}</div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link to={`/channel/${userData.username}`} className="flex-1">
            <Button variant="secondary" className="rounded-full w-full h-9 text-[13px] font-medium bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground">
              View channel
            </Button>
          </Link>
          <Button variant="secondary" className="rounded-full flex-1 h-9 text-[13px] font-medium bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground">
            Get Premium
          </Button>
        </div>
      </div>

      {/* Desktop Profile Header */}
      <div className="hidden sm:flex items-center justify-center space-x-6 pt-4">
        <AvatarImg
          avatar={userData?.avatar}
          fullname={userData?.fullname}
          className="rounded-full h-28 w-28 shrink-0 object-cover"
        />
        <div className="space-y-2">
          <div className="font-bold text-3xl">{userData?.fullname}</div>
          <div className="text-base text-muted-foreground">{`@${userData?.username
            } • ${subscriberCount} subscribers • ${(watchHistory?.videos?.length || 0) + (watchHistory?.shorts?.length || 0)
            } videos`}</div>
          <Link to={`/channel/${userData.username}`} className="inline-block mt-2">
            <Button variant="outline" className="rounded-full h-10 px-4 text-sm">
              View channel
            </Button>
          </Link>
        </div>
      </div>

      <div className="pb-24 sm:pb-10 pt-4 sm:pt-6">
        {/* Desktop Sections */}
        <div className="hidden sm:block space-y-10">
          {watchHistory?.videos.length > 0 && (
            <Library videos={watchHistory.videos} label="Watch History" />
          )}
          {playlists?.length > 0 && (
            <Library playlists={playlists} label="Playlists" />
          )}
          {watchLater?.videos.length > 0 && (
            <Library videos={watchLater.videos} label="Watch Later" />
          )}
          {likedVideos?.length > 0 && (
            <Library videos={likedVideos} label="Liked Videos" />
          )}
        </div>

        {/* Mobile Sections */}
        <div className="sm:hidden space-y-8">
          {/* History */}
          {watchHistory?.videos.length > 0 && (
            <div className="space-y-4">
              <div className="px-4">
                <Link to="/watch-history" className="inline-flex items-center text-xl font-bold">
                  History <ChevronRight className="ml-1 mt-0.5" size={20} />
                </Link>
              </div>
              <div className="flex overflow-x-auto space-x-3 px-4 no-scrollbar scrollbar-hide pb-2">
                {watchHistory.videos.map(video => (
                  <Link to={`/video/${video._id}`} key={video._id} className="min-w-[160px] max-w-[160px] flex flex-col gap-2">
                    <img src={video.thumbnail} className="w-full aspect-video object-cover rounded-lg" />
                    <div className="flex justify-between items-start">
                      <div className="text-[13px] font-medium line-clamp-2 pr-2 leading-tight">{video.title}</div>
                      <div className="shrink-0 mt-0.5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        <ThreeDots videoId={video._id} />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{video.creator?.fullname || "TubeX"}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Library List View */}
          <div className="space-y-4 px-4">
            <h2 className="text-xl font-bold">Library</h2>

            {/* Filter Chips */}
            <div className="flex space-x-2 overflow-x-auto no-scrollbar scrollbar-hide">
              <Button variant="secondary" className="rounded-md h-8 px-3 text-xs bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground font-medium">Recents ˅</Button>
              <Button variant="secondary" className="rounded-md h-8 px-3 text-xs bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground font-medium">Playlists</Button>
              <Button variant="secondary" className="rounded-md h-8 px-3 text-xs bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground font-medium">Music</Button>
              <Button variant="secondary" className="rounded-md h-8 px-3 text-xs bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground font-medium">Courses</Button>
            </div>

            {/* List Items */}
            <div className="flex flex-col space-y-4 pt-2">
              {playlists?.map(playlist => (
                <Link to={`/playlist/${playlist._id}`} key={playlist._id} className="flex items-start gap-3">
                  <div className="w-[140px] aspect-video relative rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img src={playlist.thumbnail} className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 right-1 bg-black/80 rounded px-1.5 py-0.5 flex items-center justify-center">
                      <ListVideo size={12} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-start mt-0.5">
                    <div className="font-semibold text-[15px] truncate text-foreground">{playlist.name}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{playlist.creator.fullname} • Playlist</div>
                  </div>
                </Link>
              ))}

              {likedVideos?.length > 0 && (
                <Link to="/liked-videos" className="flex items-start gap-3">
                  <div className="w-[140px] aspect-video relative rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img src={likedVideos[0].thumbnail} className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 right-1 bg-black/80 rounded px-1.5 py-0.5 flex items-center justify-center">
                      <ThumbsUp size={12} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-start mt-0.5">
                    <div className="font-semibold text-[15px] truncate text-foreground">Liked videos</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">Private</div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
