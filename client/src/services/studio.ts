import axios from "@/lib/axios";
class StudioService {
    getUserPosts = async (username: string, page: number) =>
        await axios.get(`/studio/posts/${username}?page=${page}`);
    getUserVideos = async (username: string, page: number) =>
        await axios.get(`/studio/videos/${username}?page=${page}`);
    getUserPlaylists = async (username: string, page: number) =>
        await axios.get(`/studio/playlists/${username}?page=${page}`);
    getUserShorts = async (username: string, page: number) =>
        await axios.get(`/studio/shorts/${username}?page=${page}`);
    generateAiMetadata = async (id: string) =>
        await axios.post(`/studio/generate-ai-metadata/${id}`);
}

export const studioService = new StudioService();
