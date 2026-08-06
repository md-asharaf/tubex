import { IVideoData } from "@/interfaces";
import { videoService } from "@/services/video";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { formatDuration, formatViews } from "@/lib/utils";
import { AvatarImg } from "@/components/root/avatar-image";
export const SearchedVideos = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q");
    const { data: videos, isLoading } = useQuery({
        queryKey: ["searched-videos", query],
        queryFn: async (): Promise<IVideoData[]> => {
            const data = await videoService.searchVideos(query);
            return data.videos;
        },
        enabled: !!query,
    });
    if (isLoading) {
        return (
            <div className="flex justify-center items-center w-full min-h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }
    if (!videos || videos.length === 0)
        return (
            <div className="flex items-center text-lg sm:text-2xl justify-center mt-20 sm:mt-40 w-full text-center px-4 dark:text-white">
                {videos ? `No results for "${query}"` : "Go to home page"}
            </div>
        );
    return (
        <div className="flex flex-col gap-y-4 px-4 md:px-8 xl:px-40 min-h-screen pt-4 sm:pt-8">
            {videos?.map((video) => (
                <Link to={`/video/${video._id}`} key={video._id}>
                    <div className="flex gap-x-4 rounded-lg">
                        <div className="relative flex-shrink-0 w-1/2 lg:w-2/5 xl:w-1/3 aspect-video">
                            <img
                                src={video.thumbnail}
                                className="w-full rounded-lg object-cover"
                                loading="lazy"
                            />
                            <span className="absolute bottom-2 right-2 bg-black/80 text-white px-1.5 py-0.5 text-xs font-medium rounded">
                                {formatDuration(video.duration)}
                            </span>
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden text-sm sm:text-base lg:text-lg">
                            <div className="flex flex-col sm:gap-1">
                                <h2 className="font-normal text-[16px] sm:text-[18px] leading-snug line-clamp-2">
                                    {video.title}
                                </h2>
                                <p className="text-[14px] text-muted-foreground mt-1">
                                    {`${formatViews(
                                        video.views
                                    )} • ${formatDistanceToNowStrict(
                                        new Date(video.createdAt)
                                    ).replace("about", "")} ago`}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 sm:mt-2">
                                <AvatarImg
                                    className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full object-cover"
                                    avatar={video.creator.avatar}
                                    fullname={video.creator.fullname}
                                />
                                <p className="text-[14px] text-muted-foreground hover:text-foreground">
                                    {video.creator.fullname}
                                </p>
                            </div>
                            <p
                                className="text-[14px] text-muted-foreground sm:mt-2 line-clamp-2"
                                title={video.description}
                            >
                                {video.description}
                            </p>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};
