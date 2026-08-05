import { Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { playlistService } from "@/services/playlist";
import { VideoTitle2 } from "../video/video-title2";
import { PlaylistCard } from "../playlist/playlist-card";
import { Playlist } from "@/interfaces";

export const ChannelPlaylists = () => {
    const { username } = useParams();
    const { data: playlists, isLoading } = useQuery({
        queryKey: ["playlists", username],
        queryFn: async (): Promise<Playlist[]> => {
            const data = await playlistService.getAllPlaylists(username);
            return data.playlists;
        },
        enabled: !!username,
    });
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {isLoading ? (
                <div className="flex justify-center items-center w-full min-h-[50vh] col-span-full">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
            ) : (
                playlists?.length >0 ? playlists?.map((playlist) => (
                    <Link
                        to={`/playlist/${playlist._id}`}
                        key={playlist._id}
                        className="space-y-2 rounded-xl p-2 hover:bg-muted"
                    >
                        <PlaylistCard
                            playlistThumbnail={
                                playlist.thumbnail
                            }
                            videosLength={playlist.videos.length}
                        />
                        <VideoTitle2
                            playlistName={playlist.name}
                            username={playlist.creator.username}
                            fullname={playlist.creator.fullname}
                        />
                    </Link>
                )):"No playlists"
            )}
        </div>
    );
};
