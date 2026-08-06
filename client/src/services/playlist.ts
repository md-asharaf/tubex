import axios from "@/lib/axios";
class PLaylistService {
    getAllPlaylists = async (username: string) =>
        await axios.get(`/playlists/all-playlists/${username}`);
    getPlaylistById = async (playlistId: string) =>
        await axios.get(`/playlists/${playlistId}`);
    addToPlaylist = async (playlistId: string, id: string, type: string) =>
        await axios.patch(
            `/playlists/add-video-to-playlist/${playlistId}?${type}Id=${id}`
        );
    createPlaylist = async (name: string) =>
        await axios.post(`/playlists/create-playlist`, {
            name,
            description: "",
        });
    removeFromPlaylist = async (playlistId: string, id: string, type: string) =>
        await axios.patch(
            `/playlists/remove-video-from-playlist/${playlistId}?${type}Id=${id}`
        );
    isSavedToPlaylists = async (id: string, type: string) =>
        await axios.get(
            `/playlists/is-video-saved?${type}Id=${id}`
        );
    deletePlaylist = async (playlistId: string) =>
        await axios.delete(`/playlists/delete-playlist/${playlistId}`);
}
export const playlistService = new PLaylistService();
