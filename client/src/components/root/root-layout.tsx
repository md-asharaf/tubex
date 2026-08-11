import { Outlet, useLocation } from "react-router-dom";
import { NavBar } from "@/components/root/navbar";
import { BottomBar } from "@/components/root/bottom-bar";
import { Drawer } from "@/components/root/drawer/drawer";
import { GlobalAlertDialog } from "./modals/global-alert-dialog";
import { LoginPopover } from "./modals/login-popover";
import { SharePopup } from "./modals/share-popup";
import { SaveToPlaylist } from "./modals/save-to-playlist";
import { CreatePlaylist } from "./modals/create-playlist";
export const RootLayout = () => {
  const location = useLocation();
  const hideNavbarOnMobile = location.pathname.includes("/short/") || location.pathname.includes("/library") || location.pathname === "/search" || location.pathname === "/notifications" || location.pathname === "/settings";
  const hideBottomBarOnMobile = location.pathname === "/search" || location.pathname === "/settings";

  return (
    <div className="w-full bg-white dark:bg-[#0F0F0F] h-[100dvh] flex flex-col">
      <nav className={`z-30 fixed top-0 left-0 h-12 sm:h-16 w-full ${hideNavbarOnMobile ? 'hidden sm:block' : ''}`}>
        <NavBar />
      </nav>
      <div className={`${hideNavbarOnMobile ? 'mt-0 sm:mt-16' : 'mt-12 sm:mt-16'} flex flex-1 w-full overflow-hidden sm:space-x-4`}>
        <Drawer />
        <div
          className="w-full flex-1 overflow-y-auto overflow-x-hidden pb-14 sm:pb-4"
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Outlet />
        </div>
      </div>
      {!hideBottomBarOnMobile && (
        <div className="fixed bottom-0 left-0 z-10 w-full sm:hidden">
          <BottomBar />
        </div>
      )}
      <LoginPopover />
      <SharePopup />
      <SaveToPlaylist />
      <CreatePlaylist />
      <GlobalAlertDialog />
    </div>
  );
};
