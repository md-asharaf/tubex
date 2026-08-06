import axios from "@/lib/axios";

class VideoSevice {
  upload = async (data: any) => await axios.post("/videos/publish-video", data);
  singleVideo = async (videoId: string) =>
    await axios.get(`/videos/${videoId}`);
  allVideosByUser = async (username: string) =>
    await axios.get(`/videos/user-videos/${username}`);
  likedVideos = async () => await axios.get("/videos/liked-videos");
  incrementViews = async (videoId: string) =>
    await axios.post(`/videos/increase-views/${videoId}`);
  searchVideos = async (query: string) =>
    await axios.get(`/videos/search-videos?query=${query}`);
  recommendedVideos = async (
    page: number,
    category = "All",
    videoId = null,
    userId = null
  ) =>
    await axios.get(
      `/videos/recommended-videos?page=${page}&category=${category}${
        videoId ? `&videoId=${videoId}` : ""
      }${userId ? `&userId=${userId}` : ""}`
    );
  videosCount = async (userId: string) =>
    await axios.get(`/videos/videos-count/${userId}`);
  updateVideo = async (videoId: string, data: any) =>
    await axios.patch(`/videos/update-video/${videoId}`, data);
  updateThumbnail = async (videoId: string, thumbnail: string) =>
    await axios.patch(`/videos/update-thumbnail/${videoId}`, { thumbnail });
  delete = async (videoId: string) =>
    await axios.delete(`/videos/delete-video/${videoId}`);
}
export const videoService = new VideoSevice();
