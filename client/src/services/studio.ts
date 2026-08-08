import axios from "@/lib/axios";
class StudioService {
    getUserPosts = async (username: string, page: number, search?: string) =>
        await axios.get(`/studio/posts/${username}?page=${page}${search ? `&search=${search}` : ''}`);
    getUserVideos = async (username: string, page: number, search?: string) =>
        await axios.get(`/studio/videos/${username}?page=${page}${search ? `&search=${search}` : ''}`);
    getUserPlaylists = async (username: string, page: number, search?: string) =>
        await axios.get(`/studio/playlists/${username}?page=${page}${search ? `&search=${search}` : ''}`);
    getUserShorts = async (username: string, page: number, search?: string) =>
        await axios.get(`/studio/shorts/${username}?page=${page}${search ? `&search=${search}` : ''}`);
    generateAiMetadata = async (id: string) =>
        await axios.post(`/studio/generate-ai-metadata/${id}`);
}

export const studioService = new StudioService();
