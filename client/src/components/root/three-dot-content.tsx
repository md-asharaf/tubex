import { Check, Clock4, Share2, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user";
import { toast } from "sonner";
import { queryClient } from "@/lib/query-client";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
    setSaveToPlaylistDialog,
    setShareModalData,
} from "@/store/reducers/ui";
export const ThreeDotContent = ({ videoId, task }) => {
    const dispatch = useDispatch();
    const userId = useSelector((state: RootState) => state.auth.userData?._id);
    const { data: isSavedToWatchLater, refetch } = useQuery({
        queryKey: ["is-video-saved", videoId],
        queryFn: async (): Promise<boolean> => {
            const data = await userService.isSavedToWatchLater(
                videoId,
                "video"
            );
            return data.isSaved;
        },
        enabled: !!userId,
    });
    const { mutate: saveToWatchLater } = useMutation({
        mutationFn: async () => {
            await userService.saveToWatchLater(videoId, "video");
        },
        onSuccess: () => {
            refetch();
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["watch-later", userId],
                exact: true,
            });
        },
    });

    const { mutate: removeFromWatchLater } = useMutation({
        mutationFn: async () => {
            await userService.removeFromWatchLater(videoId, "video");
        },
        onSuccess: () => {
            refetch();
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["watch-later", userId],
                exact: true,
            });
        },
    });

    return (
        <>
            <ul className="space-y-2">
                {task && (
                    <li
                        className="flex items-center space-x-2 cursor-pointer dark:hover:bg-[#535353] hover:bg-[#E5E5E5] py-2 px-4"
                        onClick={task.handler}
                    >
                        <Trash2 className="h-5 w-5" />
                        <span>{task.title}</span>
                    </li>
                )}
                <li
                    className="flex items-center space-x-2 cursor-pointer py-2 px-4 dark:hover:bg-[#535353] hover:bg-[#E5E5E5]"
                    onClick={() => {
                        if (isSavedToWatchLater) {
                            removeFromWatchLater();
                        } else {
                            saveToWatchLater();
                        }
                    }}
                >
                    {isSavedToWatchLater ? (
                        <Check className="w-5 h-5" />
                    ) : (
                        <Clock4 className="h-5 w-5" />
                    )}
                    <span>
                        {isSavedToWatchLater
                            ? "Saved to Watch Later"
                            : "Save to Watch Later"}
                    </span>
                </li>
                <li
                    className="cursor-pointer dark:hover:bg-[#535353] hover:bg-[#E5E5E5]"
                    onClick={() =>
                        dispatch(
                            setSaveToPlaylistDialog({ open: true, id: videoId })
                        )
                    }
                >
                    <div className="flex items-center space-x-2 py-2 px-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 3v16l7-3 7 3V3H5z"
                            />
                        </svg>
                        <span>Save to playlist</span>
                    </div>
                </li>
                <li
                    className="flex items-center space-x-2 cursor-pointer py-2 px-4 dark:hover:bg-[#535353] hover:bg-[#E5E5E5]"
                    onClick={() =>
                        dispatch(
                            setShareModalData({
                                open: true,
                                type: "video",
                                id: videoId,
                            })
                        )
                    }
                >
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                </li>
            </ul>
        </>
    );
};
