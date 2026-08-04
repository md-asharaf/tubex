import { SidebarProvider } from "@/components/ui/sidebar";
import { StudioNavbar } from "./sidebar/studio-navbar";
import { Navigate, Outlet } from "react-router-dom";
import UploadVideo from "../modals/video-upload";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { CreatePlaylist } from "../modals/create-playlist";

export const StudioLayout = () => {
    const userData = useSelector((state: RootState) => state.auth.userData);
    if(!userData) return <Navigate to="/login"/>
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
