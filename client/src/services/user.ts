import axios from "../lib/axios";

class UserService {
    getUserChannel = async (username: string) =>
        await axios.get(`/users/channel/${username}`);
    getCurrentUser = async () => await axios.get("/users/current-user");
    addToWatchHistory = async (id: string,type:string) =>
        await axios.post(`/users/add-to-watch-history?${type}Id=${id}`);
    removeFromWatchHistory = async (id: string,type:string) =>
        await axios.delete(`/users/remove-from-watch-history?${type}Id=${id}`);
    getWatchHistory = async () => await axios.get("/users/watch-history");
    getWatchLater = async () => await axios.get("/users/watch-later");
    clearWatchHistory = async () =>
        await axios.delete("/users/clear-watch-history");
    getUsersBySearchText = async (searchText: string) =>
        await axios.get(`/users/get-users?search=${searchText}`);
    resetPassword = async (resetToken: string, password: string) =>
        await axios.patch("/users/reset-password", {
            resetToken,
            password,
        });
    saveToWatchLater = async (id:string,type:string) =>
        await axios.post(`/users/save-to-watch-later?${type}Id=${id}`);
    removeFromWatchLater = async (id: string,type:string) => 
        await axios.patch(`/users/remove-from-watch-later?${type}Id=${id}`);
    isSavedToWatchLater = async (id: string,type:string) =>
        await axios.get(`/users/is-saved-to-watch-later?${type}Id=${id}`);
    updateAccountDetails = async (data: { fullname?: string, username?: string, email?: string, avatar?: string, coverImage?: string, description?: string }) =>
        await axios.patch("/users/update-account-details", data);
    changePassword = async (data: any) =>
        await axios.patch("/users/change-password", data);
    requestSetPasswordOtp = async () =>
        await axios.post("/users/request-otp");
    setPasswordWithOtp = async (data: any) =>
        await axios.post("/users/set-password-with-otp", data);
    searchChannels = async (query: string) =>
        await axios.get(`/users/search-channels?query=${query}`);
}

export const userService = new UserService();
