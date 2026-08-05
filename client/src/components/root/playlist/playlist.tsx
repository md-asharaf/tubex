import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { playlistService } from "@/services/playlist";
import { IPlaylist } from "@/interfaces";
import { Loader2 } from "lucide-react";
import { PlaylistComp } from "./playlist-comp";

export const Playlist = () => {
    const { id: playlistId } = useParams();
    const {
        data: playlist,
        isError,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["playlist", playlistId],
        queryFn: async (): Promise<IPlaylist> => {
            const data = await playlistService.getPlaylistById(playlistId);
            return data.playlist;
        },
        enabled: !!playlistId,
    });
    if (isLoading) {
        return (
            <div className="flex justify-center items-center w-full min-h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }
    if (isError) {
        return <div>ERROR: {error.message}</div>;
    }
    if (playlist.videos.length === 0)
        return <div>No videos in this playlist</div>;
    return (
        <PlaylistComp
            playlist={{
                _id: playlist._id,
                name: playlist.name,
                creator: playlist.creator.fullname,
                updatedAt: playlist.updatedAt,
                description: playlist.description,
                videos: playlist.videos,
                shorts: playlist.shorts,
                totalViews: playlist.videos.reduce(
                    (prev, curr) => prev + curr.views,
                    0
                ),
            }}
        />
    );
};
