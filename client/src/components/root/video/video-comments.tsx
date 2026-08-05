import { commentService } from "@/services/comment";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { TextArea } from "@/components/root/text-area";
import { Filter } from "@/components/root/filter";
import { queryClient } from "@/main";
import { Comments } from "../comments";
export const VideoComments = ({ videoId, playerRef, creatorId }) => {
    const [filter, setFilter] = useState("All");
    const userData = useSelector((state: RootState) => state.auth.userData);
    const { data: totalComments, isLoading } = useQuery({
        queryKey: ["comments-count", videoId],
        queryFn: async () => {
            const data = await commentService.commentsCount(videoId, "video");
            return data.commentsCount;
        },
    });
    const { mutate: addComment, isPending } = useMutation({
        mutationFn: async ({
            id,
            content,
        }: {
            id: string;
            content: string;
        }) => {
            const data = await commentService.comment(id, content, "video");
            return data.comment;
        },
        onSuccess: () => {
            toast.success("Comment added");
            queryClient.invalidateQueries({
                queryKey: ["comments", videoId, filter],
            });
        },
    });
    if (isLoading) {
        return (
            <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }
    return (
        <div className="space-y-2 flex flex-col h-full relative">
            <div className="flex sm:space-x-16 items-center justify-between sm:justify-normal px-1 sm:px-0 mb-3 sm:mb-0">
                <div className="font-bold text-[18px] sm:text-2xl text-foreground sm:text-zinc-600 sm:dark:text-zinc-300 sm:mb-2">
                    <span className="sm:hidden">Comments</span>
                    <span className="hidden sm:inline">{`${totalComments} Comments`}</span>
                </div>
                <Filter onFilterChange={setFilter} />
            </div>
            <div className="flex flex-col pb-16 sm:pb-0">
                <div className="hidden sm:block mb-4">
                    {userData && isPending ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <TextArea
                            fullname={userData?.fullname}
                            userAvatar={userData?.avatar}
                            placeholder="Add a public comment..."
                            onSubmit={(content) =>
                                addComment({ id: videoId, content })
                            }
                            submitLabel="Comment"
                        />
                    )}
                </div>

                <Comments
                    id={videoId}
                    creatorId={creatorId}
                    playerRef={playerRef}
                    filter={filter}
                    type="video"
                />
            </div>
            <div className="sm:hidden fixed sm:static bottom-0 left-0 right-0 bg-white dark:bg-[#212121] p-3 border-t border-gray-200 dark:border-white/10 z-20">
                {userData && isPending ? (
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <TextArea
                        fullname={userData?.fullname}
                        userAvatar={userData?.avatar}
                        placeholder="Add a comment..."
                        onSubmit={(content) =>
                            addComment({ id: videoId, content })
                        }
                        submitLabel="Comment"
                    />
                )}
            </div>
        </div>
    );
};
