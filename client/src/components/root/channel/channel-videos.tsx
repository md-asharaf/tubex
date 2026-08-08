import { toggleMenu } from "@/store/reducers/ui";
import { Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { VideoCard } from "@/components/root/video/video-card";
import { IVideoData } from "@/interfaces";
import { useQuery } from "@tanstack/react-query";
import { videoService } from "@/services/video";
import { useDispatch } from "react-redux";

export const ChannelVideos = () => {
    const dispatch = useDispatch();
    const { username } = useParams();
    const { data: videos, isLoading } = useQuery({
        queryKey: ["videos", username],
        queryFn: async (): Promise<IVideoData[]> => {
            const data = await videoService.allVideosByUser(username);
            return data.videos;
        },
        enabled: !!username,
    });
    return (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {isLoading ? (
                <div className="flex justify-center items-center w-full min-h-[50vh] col-span-full">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
            ) : (
                videos?.length>0 ? videos?.map((video, index) => (
                    <Link
                        to={`/video/${video._id}`}
                        onClick={() => dispatch(toggleMenu())}
                        key={index}
                        className="rounded-lg"
                    >
                        <VideoCard video={video} />
                    </Link>
                )):"No videos"
            )}
        </div>
    );
};
