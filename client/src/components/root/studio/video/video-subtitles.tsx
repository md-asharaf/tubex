import { useQuery } from "@tanstack/react-query";
import { Loader2, Captions } from "lucide-react";
import { useParams } from "react-router-dom";
import { videoService } from "@/services/video";
import { IVideoData } from "@/interfaces";
import { Textarea } from "@/components/ui/textarea";

export const VideoSubtitles = () => {
    const { id } = useParams();

    const { data: video, isLoading: isVideoLoading } = useQuery({
        queryKey: ["video", id],
        queryFn: async (): Promise<IVideoData> => {
            const data = await videoService.singleVideo(id as string);
            return data.video;
        },
        enabled: !!id,
    });

    const { data: subtitleContent, isLoading: isSubtitleLoading } = useQuery({
        queryKey: ["subtitle", video?.subtitle],
        queryFn: async (): Promise<string> => {
            if (!video?.subtitle) return "No subtitle URL found.";
            try {
                const response = await fetch(video.subtitle);
                if (!response.ok) return "Failed to load subtitle content.";
                return await response.text();
            } catch (error) {
                return "Failed to fetch subtitle content.";
            }
        },
        enabled: !!video && video.subtitleStatus === "READY" && !!video.subtitle,
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
                <h1 className="text-2xl font-bold tracking-tight">Subtitles</h1>
                <p className="text-muted-foreground">
                    View generated subtitles for "{video.title}"
                </p>
            </div>

            <div className="bg-white dark:bg-black border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Captions className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">Subtitles Track (.vtt)</h2>
                    </div>
                    <div className="text-sm">
                        Status: <span className={`font-semibold ${video.subtitleStatus === "READY" ? "text-green-500" : "text-yellow-500"}`}>{video.subtitleStatus}</span>
                    </div>
                </div>

                {video.subtitleStatus === "READY" ? (
                    isSubtitleLoading ? (
                        <div className="flex justify-center p-8 border rounded-md bg-muted/20">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Textarea 
                            className="min-h-[400px] font-mono text-sm leading-relaxed" 
                            value={subtitleContent || ""} 
                            readOnly 
                        />
                    )
                ) : (
                    <div className="flex items-center justify-center p-12 border rounded-md border-dashed text-muted-foreground">
                        <p>Subtitles are currently being processed or are unavailable.</p>
                    </div>
                )}
            </div>
        </div>
    );
};