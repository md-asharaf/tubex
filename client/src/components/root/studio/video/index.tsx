import { Outlet, useParams } from "react-router-dom";
import { SidebarLayout } from "../sidebar/sidebar-layout";
import { VideoSection } from "./video-section";
import { IVideoData } from "@/interfaces";
import { videoService } from "@/services/video";
import { useQuery } from "@tanstack/react-query";
export const StudioVideo = () => {
    const { id } = useParams();
    const { data: video, isLoading } = useQuery({
        queryKey: ["video", id],
        queryFn: async (): Promise<IVideoData> => {
            const data = await videoService.singleVideo(id);
            return data.video;
        },
        enabled: !!id,
    });
    if (isLoading) return null;
    return (
        <div className="flex min-h-[100dvh] pt-[4rem]">
            <SidebarLayout>
                <VideoSection
                    title={video?.title}
                    thumbnail={video?.thumbnail}
                    id={video?._id}
                    route="videos"
                />
            </SidebarLayout>
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};
