import { useDispatch, useSelector } from "react-redux";
import { SearchBar } from "./search-bar";
import { ImYoutube } from "react-icons/im";
import { Button } from "@/components/ui/button";
import { Profile } from "./profile";
import { Link } from "react-router-dom";
import { toggleMenu} from "@/store/reducers/ui";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import { toggleTheme } from "@/store/reducers/theme";
import { Menu, Search, User } from "lucide-react";
import { RootState } from "@/store/store";
import Notifications from "./notifications";
import { CreateDropdown } from "./modals/create-dropdown";
import { useState } from "react";

export const NavBar = () => {
    const dispatch = useDispatch();
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const theme = useSelector((state: RootState) => state.theme.mode);
    const userData = useSelector((state: RootState) => state.auth.userData);
    
    return (
        <div className="flex flex-col bg-white dark:bg-[#0F0F0F] w-full text-foreground">
            {/* Main navbar */}
            <div className="flex items-center justify-between p-2 sm:p-8 h-12 sm:h-16 gap-2 w-full">
                <div className="flex items-center gap-x-2 md:gap-x-4">
                    <Menu
                        strokeWidth={1.5}
                        className="text-4xl hover:bg-muted rounded-lg hidden sm:block cursor-pointer"
                        onClick={() => {
                            dispatch(toggleMenu());
                        }}
                    />
                    <button
                        className="flex items-center hover:bg-transparent text-lg space-x-1"
                        onClick={() => (location.href = "/")}
                    >
                        <ImYoutube color="red" className="text-xl" />
                        <h1 className="font-bold hidden sm:block">ShotTube</h1>
                    </button>
                </div>
                
                {/* Desktop Search */}
                <div className="hidden sm:flex items-center gap-x-2">
                    <SearchBar />
                </div>
                
                {/* Mobile Search Toggle */}
                <div className="flex sm:hidden">
                    <button
                        onClick={() => setShowMobileSearch(!showMobileSearch)}
                        className="p-1 rounded-full hover:bg-muted text-2xl"
                        aria-label="Toggle search"
                    >
                        <Search />
                    </button>
                </div>
                
                <div className="flex gap-1 sm:gap-4 lg:gap-8 items-center">
                    <div>
                        <DarkModeSwitch
                            checked={theme === "dark"}
                            onChange={() => dispatch(toggleTheme())}
                        />
                    </div>
                    {userData ? (
                        <>
                            <CreateDropdown/>
                            <Notifications />
                            <Profile />
                        </>
                    ) : (
                        <Link to={"/login"}>
                            <Button
                                className="rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                <span className="text-sm sm:text-base">Log in</span>
                                <User
                                    className="hidden sm:block"
                                    height={25}
                                    width={25}
                                />
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
            
            {/* Mobile Search Bar - Expands below navbar */}
            {showMobileSearch && (
                <div className="sm:hidden p-2 border-t dark:border-gray-700 bg-white dark:bg-[#0F0F0F]">
                    <SearchBar />
                </div>
            )}
        </div>
    );
};
