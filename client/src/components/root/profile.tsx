import { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { authService } from "@/services/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { logoutFromGoogle } from "@/lib/firebase";
import { toast } from "sonner";
import { logout } from "@/store/reducers/auth";
import { toggleTheme } from "@/store/reducers/theme";
import { AvatarImg } from "./avatar-image";
import { ClapperboardIcon, LogOutIcon, MoonStarIcon, SettingsIcon, SunIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
export const Profile = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const { username, fullname, avatar } = useSelector(
    (state: RootState) => state.auth.userData
  ) || {};
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const navigate = useNavigate();
  const onLogout = async () => {
    try {
      await logoutFromGoogle();
      await authService.logout();
      toast.success("Logged out.");
      dispatch(logout());
      navigate("/");
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex items-center justify-center rounded-full focus:outline-none">
        <AvatarImg fullname={fullname} avatar={avatar} className="h-8 w-8 sm:h-9 sm:w-9" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="m-0 min-w-[280px] p-0 sm:min-w-[300px]"
        collisionPadding={20}
      >
        <DropdownMenuItem className="p-0">
          <Link to={`/channel/${username}`} className="w-full p-3">
            <div className="flex items-center gap-3">
              <AvatarImg
                className="h-11 w-11"
                fullname={fullname}
                avatar={avatar}
              />
              <div className="min-w-0">
                <div className="truncate font-semibold">{fullname}</div>
                <div className="truncate text-sm text-muted-foreground hover:underline">
                  @{username}
                </div>
              </div>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem className="p-0">
          <button
            onClick={() => dispatch(toggleTheme())}
            className="flex w-full items-center gap-3 rounded-none px-3 py-3 text-left"
          >
            {themeMode === "dark" ? <SunIcon size={18} /> : <MoonStarIcon size={18} />}
            <span>{themeMode === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <Link to={`/studio/${username}`} className="flex w-full items-center gap-3 rounded-none px-3 py-3">
            <ClapperboardIcon size={18} />
            <span>Studio</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <Link to={`/account/${username}`} className="flex w-full items-center gap-3 rounded-none px-3 py-3">
            <SettingsIcon size={18} />
            <span>Manage your account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-none px-3 py-3 text-left"
          >
            <LogOutIcon size={18} />
            <span>Sign out</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
