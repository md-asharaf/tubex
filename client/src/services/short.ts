import axios from "@/lib/axios";

class ShortSevice {
  upload = async (data: any) => await axios.post("/shorts/publish-short", data);
  singleShort = async (shortId: string) =>
    await axios.get(`/shorts/${shortId}`);
  allShortsByUser = async (userId: string) =>
    await axios.get(`/shorts/user-shorts/${userId}`);
  likedShorts = async () => await axios.get("/shorts/liked-shorts");
  incrementViews = async (shortId: string) =>
    await axios.post(`/shorts/increase-views/${shortId}`);
  searchShorts = async (query: string) =>
    await axios.get(`/shorts/search-shorts?query=${query}`);
  recommendedShorts = async (
    page: number,
    shortId = null,
    userId = null
  ) =>
    await axios.get(
      `/shorts/recommended-shorts?page=${page}${
        shortId ? `&shortId=${shortId}` : ""
      }${userId ? `&userId=${userId}` : ""}`
    );
  updateShort = async (shortId: string, data: any) =>
    await axios.patch(`/shorts/update-short/${shortId}`, data);
  randomShort = async () => await axios.get("/shorts/random-short");
  deleteShort = async (shortId: string) =>
    await axios.delete(`/shorts/delete-short/${shortId}`);
}
export const shortService = new ShortSevice();
