import { INotification } from "@/interfaces";
import { createSlice } from "@reduxjs/toolkit";
interface INotificationsData {
    newNotificationCount: number;
    notifications: INotification[];
}
const notificationCount = localStorage.getItem("new_notification_count");
const initialState: INotificationsData = {
    newNotificationCount: Number(notificationCount) || 0,
    notifications: [],
};

const notificationSlice = createSlice({
    name: "notification",
    initialState,
    reducers: {
        resetNotificationCount: (state) => {
            state.newNotificationCount = 0;
        },
        addNotification: (state, action) => {
            state.notifications.push(action.payload);
            state.newNotificationCount += 1;
        },
        setNotifications: (state, action) => {
            state.notifications = action.payload;
        },
        markNotificationAsRead: (state, action) => {
            state.notifications[action.payload].read = true;
        },
    },
});

export const {
    resetNotificationCount,
    addNotification,
    setNotifications,
    markNotificationAsRead,
} = notificationSlice.actions;
export default notificationSlice.reducer;
