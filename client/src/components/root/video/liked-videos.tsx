import { Button } from "@/components/ui/button";
import { IVideoData } from "@/interfaces";
import { videoService } from "@/services/video";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { PlaylistComp } from "../playlist/playlist-comp";

export const LikedVideos = () => {
    const userData = useSelector((state: RootState) => state.auth.userData);

    const {
        data: videos,
        isError,
        error,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ["liked-videos", userData?._id],
        queryFn: async (): Promise<IVideoData[]> => {
            const data = await videoService.likedVideos();
            return data.likedVideos;
        },
        enabled: !!userData?._id,
    });

    if (isLoading || isFetching) {
        return (
            <div className="flex justify-center items-center w-full min-h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }
    const shorts = [];
    if (isError) {
        const errorMessage = error?.message || "Something went wrong.";
        return (
            <div className="flex items-center justify-center h-full text-xl text-red-500">
                <p>ERROR: {errorMessage}</p>
                <Button
                    onClick={() => window.location.reload()}
                    className="ml-4 bg-red-500 text-white"
                >
                    Retry
                </Button>
            </div>
        );
    }

    if (!videos || videos.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-2xl">
                No liked videos...
            </div>
        );
    }

    return (
        <PlaylistComp
            playlist={{
                name: "Liked Videos",
                creator: userData?.fullname,
                updatedAt: new Date(),
                totalViews: videos?.reduce(
                    (prev, curr) => prev + (curr?.views || 0),
                    0
                ),
                videos,
                shorts,
                description: "Liked videos by you",
            }}
            refetch={refetch}
        />
    );
};
