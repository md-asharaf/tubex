import { useNavigate } from "react-router-dom";
interface Props {
    playlistName: string;
    username: string;
    fullname: string;
}
export const VideoTitle2: React.FC<Props> = ({
    playlistName,
    username,
    fullname,
}) => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col cursor-pointer dark:text-white mt-3">
            <span className="font-semibold text-[16px] leading-snug line-clamp-2 mb-1">{playlistName}</span>
            <span
                className="text-[14px] text-muted-foreground hover:dark:text-white hover:text-black"
                onClick={(e) => {
                    e.preventDefault();
                    navigate(`/channel/${username}`);
                }}
            >{`${fullname} • playlist`}</span>
            <span className="text-[14px] font-medium text-muted-foreground hover:dark:text-white hover:text-black">
                View full playlist
            </span>
        </div>
    );
};
