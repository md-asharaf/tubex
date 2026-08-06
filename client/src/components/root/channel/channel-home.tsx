import { Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { videoService } from "@/services/video";
import { shortService } from "@/services/short";
import { postService } from "@/services/post";
import { IPostData, IShortData, IVideoData } from "@/interfaces";
import { VideoCard } from "../video/video-card";
import { ShortCard } from "../short/short-card";
import { PostCard } from "../post/post-card";
import { useRef } from "react";

export const ChannelHome = () => {
    const { username } = useParams();
    const playerRef = useRef(null);

    const { data: videos = [], isLoading: isVideosLoading } = useQuery({
        queryKey: ["channel-videos-preview", username],
        queryFn: async (): Promise<IVideoData[]> => {
            const data = await videoService.allVideosByUser(username);
            return data.videos;
        },
        enabled: !!username,
    });

    const { data: shorts = [], isLoading: isShortsLoading } = useQuery({
        queryKey: ["channel-shorts-preview", username],
        queryFn: async (): Promise<IShortData[]> => {
            const data = await shortService.allShortsByUser(username);
            return data.shorts;
        },
        enabled: !!username,
    });

    const { data: posts = [], isLoading: isPostsLoading } = useQuery({
        queryKey: ["channel-posts-preview", username],
        queryFn: async (): Promise<IPostData[]> => {
            const data = await postService.getUserPosts(username);
            return data.posts;
        },
        enabled: !!username,
    });

    const isLoading = isVideosLoading || isShortsLoading || isPostsLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center w-full min-h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {videos.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-bold">Latest videos</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                        {videos.slice(0, 4).map((video) => (
                            <Link to={`/video/${video._id}`} key={video._id} className="block">
                                <VideoCard video={video} playerRef={playerRef} />
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {shorts.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-bold">Latest shorts</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                        {shorts.slice(0, 5).map((short) => (
                            <Link to={`/short/${short._id}`} key={short._id} className="block">
                                <ShortCard short={short} playerRef={playerRef} />
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {posts.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-bold">Latest posts</h3>
                    </div>
                    <div className="space-y-4">
                        {posts.slice(0, 3).map((post) => (
                            <Link to={`/post/${post._id}`} key={post._id} className="block">
                                <PostCard post={post} />
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {videos.length === 0 && shorts.length === 0 && posts.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    This channel hasn’t published anything yet.
                </div>
            )}
        </div>
    );
};