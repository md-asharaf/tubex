import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { VideoCard } from "@/components/root/video/video-card";
import { videoService } from "@/services/video";
import { shortService } from "@/services/short";
import { LoadingSkeleton } from "@/components/root/loading-skeleton";
import { IVideoData } from "@/interfaces";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setShorts } from "@/store/reducers/short";
import { SiYoutubeshorts } from "react-icons/si";
import { useIntersection } from "@mantine/hooks";
import { ShortCard } from "@/components/root/short/short-card";
import { FilterCarousel } from "../filter-carousel";
export const Home = () => {
    const [filter, setFilter] = useState("All");
    const dispatch = useDispatch();
    const userId = useSelector((state: RootState) => state.auth.userData?._id);
    const shorts = useSelector((state: RootState) => state.short.shorts);
    const playerRef = useRef(null);
    const lastVideoRef = useRef<HTMLElement>(null);

    const {
        data: videoPages,
        hasNextPage,
        fetchNextPage,
        isLoading: isVideosLoading,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["recommended-videos", filter, userId, null],
        queryFn: async ({ pageParam }): Promise<IVideoData[]> => {
            const data = await videoService.recommendedVideos(
                pageParam,
                filter,
                null,
                userId
            );
            return data.recommendations;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === 12 ? allPages.length + 1 : null;
        },
        enabled: !!filter,
    });
    const videos = videoPages?.pages?.flatMap((page) => page);
    const { isLoading: isShortsLoading } = useQuery({
        queryKey: ["recommended-shorts", userId, null],
        queryFn: async () => {
            const data = await shortService.recommendedShorts(1, null, userId);
            dispatch(setShorts(data.recommendations));
            return true;
        },
    });
    const { ref, entry } = useIntersection({
        root: lastVideoRef.current,
        threshold: 1,
    });
    useEffect(() => {
        if (entry?.isIntersecting && hasNextPage) {
            fetchNextPage();
        }
    }, [entry]);
    if (isVideosLoading || isShortsLoading) {
        return <LoadingSkeleton />;
    }
    return (
        <div className="relative">
            <div className="sticky top-0 right-0 left-0 z-10 py-3 bg-white dark:bg-[#0F0F0F]">
                <FilterCarousel value={filter} setValue={setFilter} />
            </div>
            <div className="pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 sm:gap-y-2 w-full ">
                    {videos?.map((video, i) => (
                        <Link
                            to={`/video/${video._id}`}
                            key={video._id}
                            ref={i == videos.length ? ref : null}
                        >
                            <VideoCard
                                playerRef={playerRef}
                                video={video}
                                isAvatar
                                putExtraOptions
                            />
                        </Link>
                    ))}
                </div>
                {shorts?.length > 0 && filter === "All" && (
                    <>
                        <div className="flex items-center justify-between my-2">
                            <div className="flex items-center space-x-2">
                                <SiYoutubeshorts className="text-2xl" />
                                <div className="font-bold text-2xl">Shorts</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-y-2 w-full">
                            {shorts?.map((short) => (
                                <Link
                                    to={`/short/${short._id}`}
                                    key={short._id}
                                >
                                    <ShortCard
                                        short={short}
                                        playerRef={playerRef}
                                    />
                                </Link>
                            ))}
                        </div>
                    </>
                )}

                <div className="flex items-center justify-center">
                    {isFetchingNextPage && (
                        <Loader2 className="animate-spin h-10 w-10" />
                    )}
                </div>
            </div>
        </div>
    );
};
