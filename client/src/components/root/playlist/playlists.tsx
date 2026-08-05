import { IVideoData, Playlist } from "@/interfaces";
import { useSelector } from "react-redux";
import { VideoTitle2 } from "@/components/root/video/video-title2";
import { Link } from "react-router-dom";
import { playlistService } from "@/services/playlist";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { videoService } from "@/services/video";
import { userService } from "@/services/user";
import { RootState } from "@/store/store";
import { PlaylistCard } from "./playlist-card";
import { Separator } from "@radix-ui/react-dropdown-menu";

export const PlayLists = () => {
  const userData = useSelector((state: RootState) => state.auth?.userData);
  const {
    data: playlists,
    isError,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["playlists", userData?.username],
    queryFn: async (): Promise<Playlist[]> => {
      const data = await playlistService.getAllPlaylists(userData?.username);
      return data.playlists;
    },
    enabled: !!userData?.username,
  });
  const { data: likedVideos, isLoading: isLikedVideosLoading } = useQuery({
    queryKey: ["liked-videos", userData?._id],
    queryFn: async (): Promise<IVideoData[]> => {
      const data = await videoService.likedVideos();
      return data.likedVideos;
    },
    enabled: !!userData?._id,
  });
  const { data: watchLater, isLoading: isWatchLaterLoading } = useQuery({
    queryKey: ["watch-later", userData?._id],
    queryFn: async (): Promise<Playlist> => {
      const data = await userService.getWatchLater();
      return data.watchLater;
    },
    enabled: !!userData?._id,
  });
  if (isLoading || isLikedVideosLoading || isWatchLaterLoading) {
    return (
      <div className="flex justify-center items-center w-full min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError) return <div>Error: {error.message}</div>;
  return (
    <div className="px-2 text-foreground w-full">
      <h1 className="text-2xl sm:text-3xl mb-3">
        {playlists?.length > 0 ? "Playlists" : "No playlists yet"}
      </h1>
      <Separator />
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2">
        {playlists?.map((playlist) => (
          <Link
            to={`/playlist/${playlist._id}`}
            key={playlist._id}
            className="space-y-2 rounded-xl p-2 hover:bg-muted"
          >
            <PlaylistCard
              playlistThumbnail={playlist.thumbnail}
              videosLength={playlist.videos.length}
            />
            <VideoTitle2
              playlistName={playlist.name}
              username={playlist.creator.username}
              fullname={playlist.creator.fullname}
            />
          </Link>
        ))}
        <Link
          to="/liked-videos"
          className="space-y-2 rounded-xl p-2 hover:bg-muted"
        >
          <PlaylistCard
            playlistThumbnail={
              likedVideos.length > 0 ? likedVideos[0].thumbnail : null
            }
            videosLength={likedVideos.length}
          />
          <VideoTitle2
            playlistName="Liked Videos"
            username={userData?.username}
            fullname={userData?.fullname}
          />
        </Link>
        <Link
          to="/watch-later"
          className="space-y-2 rounded-xl p-2 hover:bg-muted"
        >
          <PlaylistCard
            playlistThumbnail={watchLater.thumbnail}
            videosLength={watchLater.videos.length}
          />
          <VideoTitle2
            playlistName="Watch Later"
            username={userData?.username}
            fullname={userData?.fullname}
          />
        </Link>
      </div>
    </div>
  );
};

export default PlayLists;
