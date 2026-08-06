import { useQuery } from "@tanstack/react-query";
import { Loader2, Eye, ThumbsUp, MessageSquare } from "lucide-react";
import { useParams } from "react-router-dom";
import { videoService } from "@/services/video";
import { likeService } from "@/services/like";
import { commentService } from "@/services/comment";
import { IVideoData } from "@/interfaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const VideoAnalytics = () => {
    const { id } = useParams();

    const { data: video, isLoading: isVideoLoading } = useQuery({
        queryKey: ["video", id],
        queryFn: async (): Promise<IVideoData> => {
            const data = await videoService.singleVideo(id as string);
            return data.video;
        },
        enabled: !!id,
    });

    const { data: likesCount } = useQuery({
        queryKey: ["likes-count", id, "video"],
        queryFn: async (): Promise<number> => {
            const data = await likeService.likesCount(id as string, "video");
            return data.likesCount;
        },
        enabled: !!id,
    });

    const { data: commentsCount } = useQuery({
        queryKey: ["comments-count", id, "video"],
        queryFn: async (): Promise<number> => {
            const data = await commentService.commentsCount(id as string, "video");
            return data.commentsCount;
        },
        enabled: !!id,
    });

    if (isVideoLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!video) return null;

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">
                    Performance metrics for "{video.title}"
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{video.views || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Likes</CardTitle>
                        <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {likesCount !== undefined ? likesCount : <Loader2 className="w-4 h-4 animate-spin" />}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Comments</CardTitle>
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {commentsCount !== undefined ? commentsCount : <Loader2 className="w-4 h-4 animate-spin" />}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};