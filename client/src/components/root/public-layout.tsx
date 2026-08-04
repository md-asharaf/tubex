import { Outlet } from "react-router-dom";
import { NavBar } from "@/components/root/navbar";
import { BottomBar } from "@/components/root/bottom-bar";
import { Drawer } from "@/components/root/drawer/drawer";
import useSocketNotifications from "@/hooks/use-notification";
import { GlobalAlertDialog } from "./modals/global-alert-dialog";
import LoginPopover from "./modals/login-popover";
import { SharePopup } from "./modals/share-popup";
import { SaveToPlaylist } from "./modals/save-to-playlist";
import { CreatePlaylist } from "./modals/create-playlist";
export const RootLayOut = () => {
    useSocketNotifications();
    return (
        <div className="w-full bg-white dark:bg-[#0F0F0F] h-[100dvh] flex flex-col">
            <nav className="z-30 fixed top-0 left-0 h-12 sm:h-16 w-full">
                <NavBar />
            </nav>
            <div className="mt-12 flex flex-1 w-full overflow-hidden sm:mt-16 sm:space-x-4">
                <Drawer />
                <div
                    className="w-full flex-1 overflow-y-auto overflow-x-hidden pb-24 sm:pb-4"
                    style={{
                        WebkitOverflowScrolling: "touch",
                    }}
                >
                    <Outlet />
                </div>
            </div>
            <div className="fixed bottom-0 left-0 z-10 w-full sm:hidden">
                <BottomBar />
            </div>
            <LoginPopover />
            <SharePopup />
            <SaveToPlaylist />
            <CreatePlaylist />
            <GlobalAlertDialog/>
        </div>
    );
};
