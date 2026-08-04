import { useDispatch, useSelector } from "react-redux";
import { SearchBar } from "./search-bar";
import { ImYoutube } from "react-icons/im";
import { Button } from "@/components/ui/button";
import { Profile } from "./profile";
import { Link } from "react-router-dom";
import { toggleMenu } from "@/store/reducers/ui";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { toggleTheme } from "@/store/reducers/theme";
import { Menu, Search, User } from "lucide-react";
import { RootState } from "@/store/store";
import Notifications from "./notifications";
import { CreateDropdown } from "./modals/create-dropdown";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export const NavBar = () => {
  const dispatch = useDispatch();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const theme = useSelector((state: RootState) => state.theme.mode);
  const userData = useSelector((state: RootState) => state.auth.userData);

  return (
    <div className="flex flex-col bg-white dark:bg-[#0F0F0F] w-full text-foreground">
      {/* Mobile Full-Screen Search Mode */}
      {showMobileSearch ? (
        <div className="flex h-12 items-center gap-2 px-2 py-1 sm:hidden w-full">
          <button
            onClick={() => setShowMobileSearch(false)}
            className="p-2 rounded-full hover:bg-muted"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <SearchBar />
          </div>
        </div>
      ) : (
        <div className="flex h-12 items-center justify-between gap-2 px-2 py-1 sm:h-16 sm:px-4 sm:py-2 lg:px-8 w-full">
          <div className="flex items-center gap-x-2 md:gap-x-4">
            <Menu
              strokeWidth={1.5}
              className="text-4xl hover:bg-muted rounded-lg hidden sm:block cursor-pointer"
              onClick={() => {
                dispatch(toggleMenu());
              }}
            />
            <button
              className="flex items-center hover:bg-transparent text-lg space-x-1 sm:space-x-2"
              onClick={() => (location.href = "/")}
            >
              <ImYoutube color="red" className="text-2xl sm:text-3xl" />
              <h1 className="font-bold text-lg sm:text-xl tracking-tight">TubeX</h1>
            </button>
          </div>

          {/* Desktop Search */}
          <div className="hidden sm:flex items-center gap-x-2">
            <SearchBar />
          </div>

          {/* Mobile Search Toggle */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setShowMobileSearch(true)}
              className="p-2 rounded-full hover:bg-muted text-xl"
              aria-label="Toggle search"
            >
              <Search size={22} />
            </button>
          </div>

          <div className="flex gap-2 sm:gap-4 lg:gap-8 items-center">
            <div className="hidden sm:block">
              <DarkModeSwitch
                checked={theme === "dark"}
                onChange={() => dispatch(toggleTheme())}
              />
            </div>
            {userData ? (
              <>
                <CreateDropdown />
                <Notifications />
                <Profile />
              </>
            ) : (
              <Link to={"/login"}>
                <Button
                  className="h-8 rounded-full bg-blue-500 px-3 py-0 text-white hover:bg-blue-600 sm:h-10 sm:px-4"
                >
                  <span className="text-xs sm:text-sm">Log in</span>
                  <User
                    className="hidden sm:block"
                    size={18}
                  />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
