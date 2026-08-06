import { Comments } from "@/components/root/comments";
import { Filter } from "@/components/root/filter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { videoService } from "@/services/video";
import { IVideoData } from "@/interfaces";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Separator } from "@/components/ui/separator";

export const VideoComments = () => {
    const { id } = useParams();
    const [filter, setFilter] = useState("All");
    const { userData } = useSelector((state: RootState) => state.auth);

    const { data: video, isLoading } = useQuery({
        queryKey: ["video", id],
        queryFn: async (): Promise<IVideoData> => {
            const data = await videoService.singleVideo(id as string);
            return data.video;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!video) return null;

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Comments</h1>
                    <p className="text-muted-foreground">
                        Manage comments for "{video.title}"
                    </p>
                </div>
                <Filter onFilterChange={setFilter} />
            </div>
            
            <Separator />
            
            <div className="bg-white dark:bg-black border rounded-lg p-2 sm:p-4">
                <Comments
                    id={video._id}
                    creatorId={userData?._id as string}
                    playerRef={null}
                    filter={filter}
                    type="video"
                />
            </div>
        </div>
    );
};