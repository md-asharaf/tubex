import { Button } from "@/components/ui/button";
import { IShortData, IVideoData } from "@/interfaces";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { userService } from "@/services/user";
import { RootState } from "@/store/store";
import { PlaylistComp } from "./playlist/playlist-comp";

export const WatchLater = () => {
    const userData = useSelector((state: RootState) => state.auth.userData);
    const {
        data: watchLater,
        isError,
        error,
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ["watch-later", userData?._id],
        queryFn: async (): Promise<{
            videos: IVideoData[];
            shorts: IShortData[];
        }> => {
            const data = await userService.getWatchLater();
            return data.watchLater;
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
    const videos = watchLater.videos;
    const shorts = watchLater.shorts;
    if (videos.length === 0 && shorts.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-2xl">
                No videos or shorts saved to watch later
            </div>
        );
    }

    return (
        <PlaylistComp
            playlist={{
                name: "Watch Later",
                creator: userData?.fullname,
                updatedAt: new Date(),
                totalViews: videos?.reduce(
                    (prev, curr) => prev + (curr?.views || 0),
                    0
                ),
                videos,
                shorts,
                description: "videos you saved to watch later",
            }}
        />
    );
};
