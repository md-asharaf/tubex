import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducers/auth";
import uiReducer from "./reducers/ui";
import themeReducer from "./reducers/theme";
import shortReducer from "./reducers/short";
import notificationReducer from "./reducers/notification";
import { uiMiddleware } from "./middlewares/uiMiddleware";
import { authMiddleware } from "./middlewares/authMiddleware";
import { themeMiddleware } from "./middlewares/themeMiddleware";
import { notificationMiddleware } from "./middlewares/notificationMiddleware";
export const store = configureStore({
    reducer: {
        auth: authReducer,
        ui: uiReducer,
        theme: themeReducer,
        notification: notificationReducer,
        short: shortReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredPaths: ['ui.alertDialogData.onConfirm'],
                ignoredActions: ['ui/setAlertDialogData'],
            },
        }).concat(
            uiMiddleware,
            authMiddleware,
            themeMiddleware,
            notificationMiddleware
        ),
});
export type AppDispatch = typeof store.dispatch;
export type RootState = {
    auth: ReturnType<typeof authReducer>;
    ui: ReturnType<typeof uiReducer>;
    theme: ReturnType<typeof themeReducer>;
    notification: ReturnType<typeof notificationReducer>;
    short: ReturnType<typeof shortReducer>;
};
