import axios from "axios";
import { ApiResponse } from "@/interfaces";
import { store } from "@/store/store";
import { setLoginPopoverData } from "@/store/reducers/ui";
import { logout, login } from "@/store/reducers/auth";
import { authService } from "@/services/auth";

const axiosInstance = axios.create({
    baseURL: process.env.BACKEND_BASE_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(null);
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => response.data.data,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => axiosInstance(originalRequest));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const data = await authService.loginViaRefreshToken();
                store.dispatch(login(data.user));
                
                processQueue(null);
                
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                store.dispatch(logout());
                authService.logout();
                
                let message = "Session expired. Please log in again.";
                
                if (refreshError?.response?.status === 401) {
                    message = "Your session has expired. Please log in.";
                } else if (refreshError?.message === "Network Error") {
                    message = "Network error. Please check your connection and try again.";
                } else {
                    message = error.response?.data?.message || message;
                }

                store.dispatch(
                    setLoginPopoverData({
                        message,
                        open: true,
                    })
                );

                processQueue(refreshError);
                isRefreshing = false;

                return Promise.reject(error.response?.data as ApiResponse);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error.response?.data as ApiResponse);
    }
);
class Axios {
    get<T = any>(url: string): Promise<T> {
        return axiosInstance.get(url);
    }
    post<T = any>(url: string, data?: any): Promise<T> {
        return axiosInstance.post(url, data);
    }
    put<T = any>(url: string, data?: any): Promise<T> {
        return axiosInstance.put(url, data);
    }
    patch<T = any>(url: string, data?: any): Promise<T> {
        return axiosInstance.patch(url, data);
    }
    delete<T = any>(url: string): Promise<T> {
        return axiosInstance.delete(url);
    }
}

export default new Axios();
