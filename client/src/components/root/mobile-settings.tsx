import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MoonStarIcon, SunIcon, ClapperboardIcon, SettingsIcon, LogOutIcon } from "lucide-react";
import { toggleTheme } from "@/store/reducers/theme";
import { logout } from "@/store/reducers/auth";
import { authService } from "@/services/auth";
import { logoutFromGoogle } from "@/lib/firebase";
import { toast } from "sonner";

export const MobileSettings = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { username } = useSelector((state: RootState) => state.auth.userData) || {};
    const themeMode = useSelector((state: RootState) => state.theme.mode);

    const onLogout = async () => {
        try {
            await logoutFromGoogle();
            await authService.logout();
            toast.info("Logged out!!");
            dispatch(logout());
            navigate("/");
        } catch (error: any) {
            toast.error(error.message);
            console.error(error);
        }
    };

    return (
        <div className="w-full min-h-[100dvh] bg-white dark:bg-[#0F0F0F] flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-[#0F0F0F] flex items-center px-2 h-14 border-b border-muted">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold ml-2">Settings</h1>
            </div>

            {/* Settings List */}
            <div className="flex flex-col flex-1 py-2">
                <button
                    onClick={() => dispatch(toggleTheme())}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-muted/50"
                >
                    {themeMode === "dark" ? <SunIcon size={24} className="text-foreground" /> : <MoonStarIcon size={24} className="text-foreground" />}
                    <span className="text-lg">{themeMode === "dark" ? "Light mode" : "Dark mode"}</span>
                </button>
                
                <Link to={`/studio/${username}`} className="flex w-full items-center gap-4 px-4 py-4 hover:bg-muted/50">
                    <ClapperboardIcon size={24} className="text-foreground" />
                    <span className="text-lg">YouTube Studio</span>
                </Link>
                
                <Link to={`/account/${username}`} className="flex w-full items-center gap-4 px-4 py-4 hover:bg-muted/50">
                    <SettingsIcon size={24} className="text-foreground" />
                    <span className="text-lg">Manage your account</span>
                </Link>
                
                <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-muted/50"
                >
                    <LogOutIcon size={24} className="text-foreground" />
                    <span className="text-lg">Sign out</span>
                </button>
            </div>
        </div>
    );
};
