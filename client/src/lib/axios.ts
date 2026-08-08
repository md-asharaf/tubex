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

    if (originalRequest.url === "/users/refresh-tokens") {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isLoggedIn = !!store.getState().auth.userData;

      if (!isLoggedIn) {
        if (originalRequest.method?.toLowerCase() === "get") {
          return Promise.reject(error.response?.data as ApiResponse);
        } else {
          store.dispatch(
            setLoginPopoverData({
              message: "Sign In Required",
              open: true,
            })
          );
          return Promise.reject(error.response?.data as ApiResponse);
        }
      }

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
        if (
          refreshError?.response?.status === 401
        ) {
          store.dispatch(logout());
          authService.logout();

          store.dispatch(
            setLoginPopoverData({
              message: "Your session has expired",
              open: true,
            })
          );
        }

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
    return axiosInstance.get(url) as unknown as Promise<T>;
  }
  post<T = any>(url: string, data?: any): Promise<T> {
    return axiosInstance.post(url, data) as unknown as Promise<T>;
  }
  put<T = any>(url: string, data?: any): Promise<T> {
    return axiosInstance.put(url, data) as unknown as Promise<T>;
  }
  patch<T = any>(url: string, data?: any): Promise<T> {
    return axiosInstance.patch(url, data) as unknown as Promise<T>;
  }
  delete<T = any>(url: string): Promise<T> {
    return axiosInstance.delete(url) as unknown as Promise<T>;
  }
}

export default new Axios();
