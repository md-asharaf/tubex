import { SidebarProvider } from "@/components/ui/sidebar";
import { StudioNavbar } from "./sidebar/studio-navbar";
import { Outlet } from "react-router-dom";
import UploadVideo from "../modals/video-upload";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { CreatePlaylist } from "../modals/create-playlist";
import { useEffect } from "react";
import { setLoginPopoverData } from "@/store/reducers/ui";

export const StudioLayout = () => {
    const userData = useSelector((state: RootState) => state.auth.userData);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!userData) {
            dispatch(setLoginPopoverData({ open: true, message: "Sign in to access TubeX Studio" }));
        }
    }, [userData, dispatch]);

    if (!userData) {
        return <div className="w-full min-h-[100dvh]" />;
    }
    return (
        <SidebarProvider>
            <div className="w-full overflow-y-auto h-[100dvh]">
                <StudioNavbar />
                <Outlet />
                <CreatePlaylist/>
                <UploadVideo/>
            </div>
        </SidebarProvider>
    );
}
