import { Loader2, X } from "lucide-react";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { useDispatch, useSelector } from "react-redux";
import { setOpenCard } from "@/store/reducers/short";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { commentService } from "@/services/comment";
import { Separator } from "@/components/ui/separator";
import { Filter } from "@/components/root/filter";
import { TextArea } from "../text-area";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { queryClient } from "@/main";
import { Comments } from "../comments";
export const ShortComments = ({
    shortId,
    playerRef,
    creatorId,
}: {
    shortId: string;
    playerRef: any;
    creatorId: string;
}) => {
    const [filter, setFilter] = useState("All");
    const dispatch = useDispatch();
    const userData = useSelector((state: RootState) => state.auth.userData);
    const { data: totalComments, isLoading } = useQuery({
        queryKey: ["comments-count", shortId],
        queryFn: async () => {
            const data = await commentService.commentsCount(shortId, "short");
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
            const data = await commentService.comment(id, content, "short");
            return data.comment;
        },
        onSuccess: () => {
            toast.success("Comment added");
            queryClient.invalidateQueries({
                queryKey: ["comments", shortId, filter],
            });
        },
    });
    return (
        <Card className="flex flex-col w-full h-[65vh] sm:h-full sm:w-[400px] rounded-t-3xl sm:rounded-lg rounded-b-none sm:rounded-b-lg border-0 sm:border shadow-2xl">
            <CardTitle className="flex items-center justify-between p-2 text-xl">
                <div className="flex gap-2 p-2">
                    {isLoading ? (
                        <>
                            <div className="bg-gray-300 dark:bg-zinc-700 animate-pulse h-6 rounded-md w-20"></div>
                            <div className="bg-gray-300 dark:bg-zinc-700 animate-pulse h-4 rounded-md w-10"></div>
                        </>
                    ) : (
                        <>
                            <div className="font-bold">Comments</div>
                            <div className="text-muted-foreground">
                                {totalComments}
                            </div>
                        </>
                    )}
                </div>
                <div className="flex space-x-4 items-center">
                    <Filter key={shortId} onFilterChange={setFilter} />
                    <X
                        size={30}
                        strokeWidth={0.7}
                        onClick={() => dispatch(setOpenCard(""))}
                        className="cursor-pointer"
                    />
                </div>
            </CardTitle>
            <Separator />
            <CardContent className="flex-1 px-2 overflow-y-auto">
                <Comments
                    key={shortId}
                    playerRef={playerRef}
                    id={shortId}
                    creatorId={creatorId}
                    type="short"
                    filter={filter}
                />
            </CardContent>
            <Separator/>
            <CardFooter className="p-2">
                {isPending ? (
                    <div className="flex items-center justify-center w-full">
                        <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1} />
                    </div>
                ) : (
                    <TextArea
                        fullname={userData?.fullname}
                        userAvatar={userData?.avatar}
                        placeholder="Add a public comment..."
                        onSubmit={(content) =>
                            addComment({ id: shortId, content })
                        }
                        submitLabel="Comment"
                    />
                )}
            </CardFooter>
        </Card>
    );
};
