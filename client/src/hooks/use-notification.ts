import { addNotification } from "@/store/reducers/notification";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { io } from "socket.io-client";
const SOCKET_URL = process.env.WEB_SOCKET_URL;
export function useNotification() {
  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.auth.userData);

  useEffect(() => {
    if (!userData) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
      path: "/socket.io/",
    });

    socket.on("notification", (notification) => {
      dispatch(addNotification(notification));
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch, userData]);

  return;
}
