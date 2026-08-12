import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, ListVideo } from "lucide-react";
import { getRelativeShortTime } from "@/lib/time";
import { IVideoData, IShortData, Playlist, IUser } from "@/interfaces";
import { videoService } from "@/services/video";
import { shortService } from "@/services/short";
import { playlistService } from "@/services/playlist";
import { userService } from "@/services/user";
import { formatDuration, formatViews } from "@/lib/utils";
import { AvatarImg } from "@/components/root/avatar-image";
import { Button } from "@/components/ui/button";
import { VideoCard } from "./video-card";

const FILTER_TABS = ["All", "Channels", "Videos", "Shorts", "Playlists"] as const;
type FilterTab = typeof FILTER_TABS[number];

export const SearchedVideos = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ["searched-videos", query],
    queryFn: async (): Promise<IVideoData[]> => {
      const data = await videoService.searchVideos(query);
      return data.videos;
    },
    enabled: !!query && (activeTab === "All" || activeTab === "Videos"),
  });

  const { data: shorts, isLoading: shortsLoading } = useQuery({
    queryKey: ["searched-shorts", query],
    queryFn: async (): Promise<IShortData[]> => {
      const data = await shortService.searchShorts(query);
      return data.shorts; // axios wraps in data, and ApiResponse has data.shorts
    },
    enabled: !!query && (activeTab === "All" || activeTab === "Shorts"),
  });

  const { data: playlists, isLoading: playlistsLoading } = useQuery({
    queryKey: ["searched-playlists", query],
    queryFn: async (): Promise<Playlist[]> => {
      const data = await playlistService.searchPlaylists(query);
      return data.playlists;
    },
    enabled: !!query && (activeTab === "All" || activeTab === "Playlists"),
  });

  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ["searched-channels", query],
    queryFn: async (): Promise<IUser[]> => {
      const data = await userService.searchChannels(query);
      return data.channels;
    },
    enabled: !!query && (activeTab === "All" || activeTab === "Channels"),
  });

  const isLoading = videosLoading || shortsLoading || playlistsLoading || channelsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!query) return null;

  const renderVideos = (items: IVideoData[]) => (
    <div className="flex flex-col gap-y-4 sm:gap-y-6">
      {items?.map((video) => (
        <div key={video._id}>
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <Link to={`/video/${video._id}`}>
              <VideoCard video={video} isAvatar={true} />
            </Link>
          </div>

          {/* Desktop Layout */}
          <Link to={`/video/${video._id}`} className="hidden sm:flex flex-row gap-x-4 rounded-lg">
            <div className="relative flex-shrink-0 w-[320px] md:w-[360px] aspect-video">
              <img
                src={video.thumbnail}
                className="w-full h-full rounded-xl object-cover"
                loading="lazy"
              />
              <span className="absolute bottom-2 right-2 bg-black/80 text-white px-1.5 py-0.5 text-xs font-medium rounded">
                {formatDuration(video.duration)}
              </span>
            </div>
            <div className="flex flex-col flex-1 overflow-hidden text-base lg:text-lg">
              <div className="flex flex-col gap-1">
                <h2 className="font-normal text-[18px] leading-snug line-clamp-2">
                  {video.title}
                </h2>
                <p className="text-[14px] text-muted-foreground mt-1">
                  {`${formatViews(video.views)} • ${getRelativeShortTime(new Date(video.createdAt || Date.now()))}`}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <AvatarImg
                  className="w-8 h-8 rounded-full object-cover"
                  avatar={video.creator?.avatar}
                  fullname={video.creator?.fullname || "Unknown"}
                />
                <p className="text-[14px] text-muted-foreground hover:text-foreground">
                  {video.creator?.fullname || "Unknown"}
                </p>
              </div>
              <p className="text-[14px] text-muted-foreground mt-3 line-clamp-2" title={video.description}>
                {video.description}
              </p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );

  const renderShorts = (items: IShortData[]) => (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-4 sm:overflow-x-auto pb-4 sm:snap-x sm:scrollbar-hide">
        {items?.map((short) => (
          <Link to={`/short/${short._id}`} key={short._id} className="w-full sm:w-[180px] md:w-[200px] sm:snap-start flex-shrink-0">
            <div className="relative aspect-[9/16] rounded-xl overflow-hidden mb-2">
              <img src={short.thumbnail} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute bottom-2 right-2 text-white bg-black/80 px-1.5 py-0.5 text-xs rounded">
                {formatViews(short.views)} views
              </div>
            </div>
            <h4 className="font-medium text-sm sm:text-[15px] line-clamp-2 leading-snug">{short.title}</h4>
          </Link>
        ))}
      </div>
    </div>
  );

  const renderChannels = (items: IUser[]) => (
    <div className="flex flex-col gap-6 w-full">
      {items?.map((channel) => (
        <Link to={`/channel/${channel.username}`} key={channel._id} className="flex items-center gap-4 sm:gap-6 md:gap-12 w-full justify-between sm:justify-start sm:px-12 py-2 sm:py-4 hover:bg-muted/50 rounded-xl transition-colors">
          <AvatarImg avatar={channel.avatar} fullname={channel.fullname} className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full flex-shrink-0" />
          <div className="flex flex-col flex-1">
            <h3 className="text-[18px] sm:text-xl md:text-2xl font-normal">{channel.fullname}</h3>
            <p className="text-[12px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              @{channel.username} • {formatViews(channel.subscriberCount || 0)} subscribers
            </p>
          </div>
          <Button variant="secondary" className="rounded-full hidden sm:flex">Subscribe</Button>
        </Link>
      ))}
    </div>
  );

  const renderPlaylists = (items: Playlist[]) => (
    <div className="flex flex-col gap-y-4 sm:gap-y-6">
      {items?.map((playlist) => (
        <div key={playlist._id}>
          {/* Mobile Layout */}
          <Link to={`/playlist/${playlist._id}`} className="block sm:hidden">
            <div className="flex flex-col rounded-lg">
              <div className="relative w-full aspect-video">
                <img src={playlist.thumbnail || playlist.creator?.avatar} className="w-full h-full rounded-xl object-cover" loading="lazy" />
                <div className="absolute bottom-2 right-2 bg-black/80 flex items-center gap-1 rounded py-1 px-2">
                  <ListVideo className="w-[14px] h-[14px] text-white" />
                  <span className="text-white font-medium text-[12px]">
                    {(playlist.videos?.length || 0) + (playlist.shorts?.length || 0)} videos
                  </span>
                </div>
              </div>
              <div className="flex gap-3 items-start mt-3">
                <AvatarImg
                  className="w-10 h-10 rounded-full object-cover"
                  avatar={playlist.creator?.avatar}
                  fullname={playlist.creator?.fullname || "Unknown"}
                />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <h2 className="font-semibold text-[16px] leading-snug line-clamp-2">{playlist.name}</h2>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    {playlist.creator?.fullname || "Unknown"} • Playlist {playlist.updatedAt && `• Updated ${getRelativeShortTime(new Date(playlist.updatedAt))}`}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Layout */}
          <Link to={`/playlist/${playlist._id}`} className="hidden sm:flex flex-row gap-x-4 rounded-lg">
            <div className="relative flex-shrink-0 w-[320px] md:w-[360px] aspect-video">
              <img src={playlist.thumbnail || playlist.creator?.avatar} className="w-full h-full rounded-xl object-cover" loading="lazy" />
              <div className="absolute bottom-2 right-2 bg-black/80 flex items-center gap-1.5 rounded py-1 px-2">
                <ListVideo className="w-[14px] h-[14px] text-white" />
                <span className="text-white font-medium text-[12px]">
                  {(playlist.videos?.length || 0) + (playlist.shorts?.length || 0)} videos
                </span>
              </div>
            </div>
            <div className="flex flex-col flex-1 overflow-hidden mt-0">
              <h2 className="font-normal text-[18px] line-clamp-2 leading-snug">{playlist.name}</h2>
              <p className="text-[13px] text-muted-foreground mt-1">
                {playlist.creator?.fullname || "Unknown"} • Playlist {playlist.updatedAt && `• Updated ${getRelativeShortTime(new Date(playlist.updatedAt))}`}
              </p>
              <p className="text-[13px] font-medium text-muted-foreground mt-3 hover:text-foreground transition-colors">View full playlist</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );

  const noResults = !videos?.length && !shorts?.length && !channels?.length && !playlists?.length;

  return (
    <div className="flex flex-col w-full min-h-[100dvh]">
      <div className="w-full max-w-[1096px] mx-auto pt-2 sm:pt-6 px-4 md:px-8">
        <div className="flex gap-2 sm:gap-3 py-2 sm:py-3 overflow-x-auto scrollbar-hide w-full">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg whitespace-nowrap text-[13px] sm:text-sm font-medium transition-colors ${activeTab === tab
                ? "bg-foreground text-background"
                : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="pt-4 sm:pt-6 pb-4 w-full">
          {noResults ? (
            <div className="flex items-center text-[16px] sm:text-xl justify-center mt-20 w-full text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="flex flex-col gap-6 sm:gap-8 w-full">
              {activeTab === "All" && (
                <>
                  {channels && channels.length > 0 && (
                    <>
                      {renderChannels(channels.slice(0, 1))}
                      {channels.length > 0 && <hr className="my-4 border-muted" />}
                    </>
                  )}
                  {shorts && shorts.length > 0 && (
                    <>
                      {renderShorts(shorts.slice(0, 10))}
                      {shorts.length > 10 && <hr className="my-4 border-muted" />}
                    </>
                  )}
                  {videos && videos.length > 0 && renderVideos(videos)}
                  {playlists && playlists.length > 0 && (
                    <>
                      {renderPlaylists(playlists.slice(0, 3))}
                      {videos.length > 0 && <hr className="my-4 border-muted" />}
                    </>
                  )}
                </>
              )}
              {activeTab === "Videos" && videos && renderVideos(videos)}
              {activeTab === "Shorts" && shorts && renderShorts(shorts)}
              {activeTab === "Channels" && channels && renderChannels(channels)}
              {activeTab === "Playlists" && playlists && renderPlaylists(playlists)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
