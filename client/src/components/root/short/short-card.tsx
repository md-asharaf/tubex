import { useState } from "react";
import { PlyrPlayer } from "@/components/root/video-player";
import { useMutation } from "@tanstack/react-query";
import { shortService } from "@/services/short";

export const ShortCard = ({ short, playerRef }) => {
    const { mutate: increaseViews } = useMutation({
        mutationFn: async (shortId: string) => {
            await shortService.incrementViews(shortId);
        },
    });
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            className="group flex flex-col gap-2 p-2 rounded-lg relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {!isHovered ? (
                <img
                    src={short.thumbnail}
                    alt=""
                    className="w-full h-full aspect-[9/16] object-cover rounded-xl"
                />
            ) : (
                <PlyrPlayer
                thumbnail={short.thumbnail}
                    source={short.source}
                    subtitle={short.subtitle}
                    onViewTracked={() => increaseViews(short._id)}
                    className="w-full h-full aspect-[9/16]"
                    playerRef={playerRef}
                    controls={[]}
                />
            )}
            <div className="space-y-1">
                <p className="font-semibold text-[16px] leading-snug line-clamp-2">{short.title}</p>
                <div className="text-[14px] text-muted-foreground">{`${short.views} views`}</div>
            </div>
        </div>
    );
}
