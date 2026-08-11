import { Outlet } from "react-router-dom";
import { SidebarLayout } from "../sidebar/sidebar-layout";
import { PlaylistSection } from "./playlist-section";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { playlistService } from "@/services/playlist";
import { IPlaylist } from "@/interfaces";
export const StudioPlaylist = () => {
    const { id } = useParams();
    const { data:playlist, isLoading } = useQuery({
        queryKey: ["playlist", id],
        queryFn: async (): Promise<IPlaylist> => {
            const data = await playlistService.getPlaylistById(id);
            return data.playlist;
        },
        enabled: !!id,
    });
    if (isLoading) return null;
    return (
        <div className="flex min-h-[100dvh] pt-[4rem]">
            <SidebarLayout>
                <PlaylistSection
                    title={playlist.name}
                    thumbnail={playlist.videos[0].thumbnail}
                    id={playlist._id}
                    route="playlists"
                />
            </SidebarLayout>
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};
