import { SidebarTrigger } from "../../../ui/sidebar";
import { ImYoutube } from "react-icons/im";
import { SearchBar } from "../../search-bar";
import { Profile } from "../../profile";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { toggleTheme } from "@/store/reducers/theme";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { CreateDropdown } from "@/components/root/modals/create-dropdown";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export const StudioNavbar = () => {
  const theme = useSelector((state: RootState) => state.theme.mode);
  const username = useSelector(
    (state: RootState) => state.auth.userData?.username
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 bg-white dark:bg-[#0F0F0F] right-0 left-0 flex items-center justify-between h-16 px-2 sm:px-5 z-50 border-b">
      <div className="flex items-center gap-2 sm:gap-4 w-full">
        <div className="flex items-center flex-shrink-0 gap-2 sm:gap-4">
          <SidebarTrigger />
          <div
            className="flex items-center hover:bg-transparent gap-1 cursor-pointer"
            onClick={() => (location.href = `/studio/${username}`)}
          >
            <ImYoutube color="red" className="text-2xl sm:text-3xl" /> Studio
            <h1 className="font-bold text-lg sm:text-xl tracking-tight hidden sm:block">
              Studio
            </h1>
          </div>
        </div>
        <div className="flex-1 justify-center max-w-[720px] mx-auto hidden sm:flex">
          <SearchBar isStudio={true} />
        </div>
        <div className="flex items-center gap-2 sm:gap-8 ml-auto">
          <div>
            <DarkModeSwitch
              checked={theme === "dark"}
              onChange={() => dispatch(toggleTheme())}
            />
          </div>
          <div className="flex sm:hidden">
            <button
              onClick={() => navigate('/search')}
              className="p-2 rounded-full hover:bg-muted text-xl"
              aria-label="Toggle search"
            >
              <Search size={22} />
            </button>
          </div>
          <CreateDropdown isPlaylist />
        </div>
      </div>
    </nav>
  );
};
