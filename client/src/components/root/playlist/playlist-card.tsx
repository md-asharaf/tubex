import { ListVideo } from "lucide-react";

interface Props {
    playlistThumbnail: string;
    videosLength: number;
}

export const PlaylistCard: React.FC<Props> = ({ playlistThumbnail, videosLength }) => {
    return (
        <div className="relative">
            <img
                src={playlistThumbnail}
                className="w-full aspect-video object-cover rounded-xl"
                loading="lazy"
                alt="Empty playlist"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white p-2 rounded-b-xl flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-1.5 font-medium text-xs">
                    <ListVideo className="w-4 h-4" />
                    <span>{`${videosLength || 0} videos`}</span>
                </div>
            </div>
        </div>
    );
};

