import { useDispatch, useSelector } from "react-redux";
import { SearchBar } from "./search-bar";
import { ImYoutube } from "react-icons/im";
import { Button } from "@/components/ui/button";
import { Profile } from "./profile";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { setVoiceSearchModal, toggleMenu } from "@/store/reducers/ui";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { toggleTheme } from "@/store/reducers/theme";
import { Menu, Search, User, ArrowLeft, Mic } from "lucide-react";
import { RootState } from "@/store/store";
import Notifications from "./notifications";
import { CreateDropdown } from "./modals/create-dropdown";

export const NavBar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const userData = useSelector((state: RootState) => state.auth.userData);

  const isResultsPage = location.pathname === "/results";

  return (
    <div className="flex flex-col bg-white dark:bg-[#0F0F0F] w-full text-foreground">
      <div className="flex h-12 items-center justify-between gap-2 px-2 py-1 sm:h-16 sm:px-4 sm:py-2 lg:px-8 w-full">

        {/* Mobile Results Page Header */}
        {isResultsPage && (
          <div className="flex sm:hidden items-center w-full gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-muted shrink-0"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div
              className="flex-1 flex items-center bg-[#F0F0F0] dark:bg-[#272727] rounded-full px-4 h-9 cursor-text overflow-hidden"
              onClick={() => navigate("/search")}
            >
              <span className="text-sm truncate w-full text-left">
                {new URLSearchParams(location.search).get("q") || "Search TubeX"}
              </span>
            </div>
            <button className="p-2 rounded-full bg-[#F0F0F0] dark:bg-[#272727] ml-1 shrink-0" onClick={() => dispatch(setVoiceSearchModal(true))}>
              <Mic size={18} />
            </button>
          </div>
        )}

        <div className={`items-center gap-x-2 md:gap-x-4 ${isResultsPage ? 'hidden sm:flex' : 'flex'}`}>
          <Menu
            strokeWidth={1.5}
            className="text-4xl hover:bg-muted rounded-lg hidden sm:block cursor-pointer"
            onClick={() => {
              dispatch(toggleMenu());
            }}
          />
          <button
            className="flex items-center hover:bg-transparent text-lg space-x-1 sm:space-x-2"
            onClick={() => (window.location.href = "/")}
          >
            <ImYoutube color="red" className="text-2xl sm:text-3xl" />
            <h1 className="font-bold text-lg sm:text-xl tracking-tight">TubeX</h1>
          </button>
        </div>

        {/* Desktop Search */}
        <div className="hidden sm:flex items-center gap-x-2">
          <SearchBar />
        </div>

        <div className={`gap-1 sm:gap-4 lg:gap-8 items-center ${isResultsPage ? 'hidden sm:flex' : 'flex'}`}>
          <div className="hidden sm:block">
            <DarkModeSwitch
              checked={theme === "dark"}
              onChange={() => dispatch(toggleTheme())}
            />
          </div>
          {userData ? (
            <>
              <div className="hidden sm:block">
                <CreateDropdown />
              </div>
              <Notifications />
              <div className="flex sm:hidden">
                <button
                  onClick={() => navigate('/search')}
                  className="p-2 rounded-full hover:bg-muted text-xl"
                  aria-label="Toggle search"
                >
                  <Search size={22} />
                </button>
              </div>
              <div className="hidden sm:block">
                <Profile />
              </div>
            </>
          ) : (
            <>
              <div className="flex sm:hidden">
                <button
                  onClick={() => navigate('/search')}
                  className="p-2 rounded-full hover:bg-muted text-xl"
                  aria-label="Toggle search"
                >
                  <Search size={22} />
                </button>
              </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
