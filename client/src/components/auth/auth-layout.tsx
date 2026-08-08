import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toggleTheme } from "@/store/reducers/theme";
import { MoonStarIcon, SunIcon } from "lucide-react";

export const AuthLayOut = () => {
    const dispatch = useDispatch();
    const themeMode = useSelector((state: RootState) => state.theme.mode);

    return (
        <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background relative">
            <Outlet />
            <div className="absolute bottom-6 flex justify-center w-full sm:w-auto sm:right-6 sm:bottom-6">
                <button
                    onClick={() => dispatch(toggleTheme())}
                    className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-muted text-sm font-medium text-muted-foreground transition-colors"
                >
                    {themeMode === "dark" ? <SunIcon size={18} /> : <MoonStarIcon size={18} />}
                    <span>{themeMode === "dark" ? "Light mode" : "Dark mode"}</span>
                </button>
            </div>
        </div>
    );
};
