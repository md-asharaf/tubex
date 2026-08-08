import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { subService } from "@/services/subscription";
import { videoService } from "@/services/video";
import { AvatarImg } from "./avatar-image";
import { Link } from "react-router-dom";
import { VideoCard } from "./video/video-card";
import { Loader2 } from "lucide-react";
import { useIntersection } from "@mantine/hooks";
import { useEffect, useRef } from "react";
import { IVideo } from "@/interfaces";
import { Empty } from "./empty";

export const Subscriptions = () => {
    const userData = useSelector((state: RootState) => state.auth.userData);
    
    // Fetch subscribed channels
    const { data: channels, isLoading: channelsLoading } = useQuery({
        queryKey: ["subscribed-channels", userData?._id],
        queryFn: async () => {
            if (!userData?._id) return [];
            const data = await subService.getSubscribedChannels(userData._id);
            return data.subscribedChannels;
        },
        enabled: !!userData?._id,
    });

    // Fetch subscribed videos
    const {
        data: videosPages,
        isLoading: videosLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ["subscribed-videos"],
        queryFn: async ({ pageParam = 1 }) => {
            const data = await videoService.subscribedVideos(pageParam);
            return data.videos;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => 
            lastPage.hasNextPage ? allPages.length + 1 : undefined,
    });

    const videos = videosPages?.pages.flatMap((page) => page.docs) || [];

    const loadMoreRef = useRef<HTMLDivElement>(null);
    const { ref, entry } = useIntersection({
        root: loadMoreRef.current,
        threshold: 1,
    });

    useEffect(() => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [entry?.isIntersecting, fetchNextPage, hasNextPage, isFetchingNextPage]);

    if (!userData) {
        return <div className="p-4 sm:p-8">Please login to view subscriptions.</div>;
    }

    if (channelsLoading && videosLoading) {
        return (
            <div className="flex w-full h-[50vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!channelsLoading && (!channels || channels.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] px-4 text-center">
                <img src="/logo.png" alt="TubeX" className="w-16 h-16 opacity-50 mb-4 grayscale" />
                <h2 className="text-xl font-bold mb-2">Don't miss new videos</h2>
                <p className="text-muted-foreground max-w-sm mb-6">Sign in to see updates from your favorite YouTube channels</p>
                <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors">
                    Explore channels
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-screen-2xl mx-auto px-0 sm:px-6">
            {/* Horizontal Subscribed Channels Bar */}
            {channels && channels.length > 0 && (
                <div className="flex items-center space-x-6 overflow-x-auto py-6 px-4 sm:px-0 border-b border-border/40 scrollbar-hide mb-6">
                    {channels.map((channel: any) => (
                        <Link 
                            key={channel.username} 
                            to={`/channel/${channel.username}`}
                            className="flex flex-col items-center space-y-2 group flex-shrink-0"
                        >
                            <div className="relative">
                                <AvatarImg
                                    fullname={channel.fullname}
                                    avatar={channel.avatar}
                                    className="w-[56px] h-[56px] sm:w-[72px] sm:h-[72px] border border-border group-hover:border-blue-500 transition-colors"
                                />
                            </div>
                            <span className="text-xs sm:text-[13px] font-medium text-muted-foreground group-hover:text-foreground w-16 sm:w-20 truncate text-center transition-colors">
                                {channel.fullname}
                            </span>
                        </Link>
                    ))}
                </div>
            )}

            {/* Videos Grid */}
            <div className="px-2 sm:px-0 mb-6 font-semibold text-lg">Latest from your subscriptions</div>
            
            {videos.length === 0 && !videosLoading ? (
                <div className="pt-10">
                    <Empty />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-10 px-2 sm:px-0">
                    {videos.map((video: IVideo, index: number) => (
                        <VideoCard
                            key={index}
                            video={video}
                            width="w-full"
                            height="h-auto aspect-video rounded-xl"
                            details={true}
                        />
                    ))}
                </div>
            )}

            <div ref={ref} className="w-full h-20 flex items-center justify-center mt-6">
                {isFetchingNextPage && <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />}
            </div>
        </div>
    );
};
