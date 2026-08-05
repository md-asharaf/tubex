import { commentService } from "@/services/comment";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { formatDistanceToNowStrict } from "date-fns";
import { likeService } from "@/services/like";
import { IComment } from "@/interfaces";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { FiMinus } from "react-icons/fi";
import { GoDot } from "react-icons/go";
import { replyService } from "@/services/reply";
import {
    ChevronDown,
    ChevronUp,
    Edit,
    EllipsisVertical,
    Loader2,
    ThumbsUp,
    Trash,
} from "lucide-react";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Replies from "./replies";
import { queryClient } from "@/main";
import { useIntersection } from "@mantine/hooks";
import { processText } from "@/lib";
import { setAlertDialogData } from "@/store/reducers/ui";
import { TextArea } from "./text-area";
import { AvatarImg } from "./avatar-image";
import { Button } from "../ui/button";
import { DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";

interface CommentProps {
    id: string;
    playerRef: any;
    creatorId: string;
    type: string;
    filter: string;
}

export const Comments: React.FC<CommentProps> = ({
    id,
    playerRef,
    creatorId,
    type,
    filter,
}) => {
    const dispatch = useDispatch();
    const theme = useSelector((state: RootState) => state.theme.mode);
    const navigate = useNavigate();
    const userData = useSelector((state: RootState) => state.auth.userData);
    const lastCommentRef = useRef(null);
    const [isRepliesOpen, setIsRepliesOpen] = useState([]);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(
        null
    );
    const [replyingToCommentId, setReplyingToCommentId] = useState<
        string | null
    >(null);
    const {
        data: commentsPages,
        isLoading: commentsLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery({
        queryKey: [`comments`, id, filter],
        queryFn: async ({
            pageParam,
        }): Promise<{
            docs: IComment[];
            hasNextPage: boolean;
            totalDocs: number;
        }> => {
            const data = await commentService.getComments(
                id,
                pageParam,
                type,
                filter
            );
            return data.comments;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) =>
            lastPage.hasNextPage ? allPages.length + 1 : undefined,
        enabled: !!id,
    });
    const comments = commentsPages?.pages.flatMap((page) => page.docs);
    const { data: likeStatusOfComments, isLoading: likesCountLoading } =
        useQuery({
            queryKey: ["comments-like-status", id],
            queryFn: async (): Promise<boolean[]> => {
                const data = await likeService.getCommentsLikeStatus(id, type);
                return data.likedStatus;
            },
            enabled: !!comments && !!userData,
        });
    const { data: likesCountofComments, isLoading: likeStatusLoading } =
        useQuery({
            queryKey: ["comments-likes-count", id],
            queryFn: async (): Promise<number[]> => {
                const data = await likeService.getCommentsLikesCount(id, type);
                return data.likesCount;
            },
            enabled: !!comments,
        });

    const { mutate: toggleCommentLike } = useMutation({
        mutationFn: async ({
            commentId,
            index,
        }: {
            commentId: string;
            index: number;
        }) => {
            await likeService.toggleLike(commentId, "comment");
        },
        onMutate: ({ index }) => {
            queryClient.cancelQueries({
                queryKey: ["comments-like-status", id],
            });
            queryClient.cancelQueries({
                queryKey: ["comments-likes-count", id],
            });
            queryClient.setQueryData(
                ["comments-like-status", id],
                (prev: boolean[]) => {
                    const updatedLikes = [...prev];
                    updatedLikes[index] = !updatedLikes[index];
                    return updatedLikes;
                }
            );
            queryClient.setQueryData(
                ["comments-likes-count", id],
                (prev: number[]) => {
                    const updatedLikes = [...prev];
                    updatedLikes[index] += updatedLikes[index] ? -1 : 1;
                    return updatedLikes;
                }
            );
        },
        onError: (_, { index }) => {
            queryClient.cancelQueries({
                queryKey: ["comments-like-status", id],
            });
            queryClient.cancelQueries({
                queryKey: ["comments-likes-count", id],
            });
            queryClient.setQueryData(
                ["comments-like-status", id],
                (prev: boolean[]) => {
                    const updatedLikes = [...prev];
                    updatedLikes[index] = !updatedLikes[index];
                    return updatedLikes;
                }
            );
            queryClient.setQueryData(
                ["comments-likes-count", id],
                (prev: number[]) => {
                    const updatedLikes = [...prev];
                    updatedLikes[index] += updatedLikes[index] ? -1 : 1;
                    return updatedLikes;
                }
            );
        },
    });

    const { mutate: deleteComment } = useMutation({
        mutationFn: async (commentId: string) => {
            const data = await commentService.deleteComment(commentId);
            return data.commentId;
        },
        onSuccess: (commentId) => {
            toast.success("Comment deleted");
            commentsPages.pages[0].totalDocs--;
            commentsPages.pages.forEach((page) => {
                page.docs = page.docs.filter(
                    (comment) => comment._id !== commentId
                );
            });
        },
    });
    const { mutate: updateComment } = useMutation({
        mutationFn: async (content: string) => {
            await commentService.updateComment(editingCommentId, content);
        },
        onSuccess: (_, content) => {
            commentsPages.pages.forEach((page) => {
                page.docs.forEach((comment) => {
                    if (comment._id === editingCommentId)
                        comment.content = content;
                });
            });
            toast.success("Comment updated");
        },
        onSettled: () => {
            setEditingCommentId(null);
        },
    });
    const { mutate: addReply } = useMutation({
        mutationFn: async (content: string) => {
            const data = await replyService.addReply(
                replyingToCommentId,
                content
            );
            return data.reply;
        },
        onSuccess: () => {
            toast.success("Reply added");
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["replies", replyingToCommentId],
                exact: true,
            });
            setReplyingToCommentId(null);
        },
    });
    const processComment = (content: string) => processText(content, playerRef);
    const { ref, entry } = useIntersection({
        root: lastCommentRef.current,
        threshold: 1,
    });
    useEffect(() => {
        if (entry?.isIntersecting && hasNextPage) {
            fetchNextPage();
        }
    }, [entry]);
    if (commentsLoading || likeStatusLoading || likesCountLoading)
        return (
            <div className="w-full flex justify-center items-center">
                <Loader2 className="h-7 w-7 animate-spin" strokeWidth={1} />
            </div>
        );
    return (
        <div className="flex flex-col mt-4 space-y-2">
            {comments?.map((comment, index) => {
                const sentiment = comment.sentiment?.toLowerCase();
                return (
                    <div
                        key={index}
                        ref={index === comments.length - 1 ? ref : null}
                    >
                        {editingCommentId === comment._id ? (
                            <TextArea
                                fullname={userData?.fullname}
                                userAvatar={userData?.avatar}
                                initialValue={comment.content}
                                onSubmit={(content) => updateComment(content)}
                                onCancel={() => setEditingCommentId(null)}
                                submitLabel="Save"
                            />
                        ) : (
                            <div className="max-w-full">
                                <div className="flex justify-between">
                                    <div className="flex space-x-2 items-start">
                                        <AvatarImg
                                            className="rounded-full h-10 min-w-10 cursor-pointer"
                                            onClick={() =>
                                                navigate(
                                                    `/channel/${comment.creator?.username}`
                                                )
                                            }
                                            fullname={comment.creator.fullname}
                                            avatar={comment.creator.avatar}
                                        />
                                        <div>
                                            <div className="flex items-center gap-x-2 flex-wrap">
                                                <div
                                                    onClick={() =>
                                                        navigate(
                                                            `/channel/${comment.creator.username}`
                                                        )
                                                    }
                                                    className="text-sm font-medium cursor-pointer truncate max-w-[140px] sm:max-w-xs"
                                                >
                                                    {`@${comment.creator.username} `}
                                                </div>
                                                <div className="text-gray-500 dark:text-zinc-400 text-[12px]">
                                                    {formatDistanceToNowStrict(
                                                        new Date(
                                                            comment.createdAt
                                                        ),
                                                        {
                                                            addSuffix: true,
                                                        }
                                                    )}
                                                </div>
                                                {userData?._id ===
                                                    creatorId && (
                                                    <div
                                                        className={`flex ${
                                                            sentiment ===
                                                                "positive" &&
                                                            "bg-green-500"
                                                        } ${
                                                            sentiment ===
                                                                "negative" &&
                                                            "bg-red-500"
                                                        } ${
                                                            sentiment ===
                                                                "neutral" &&
                                                            "bg-yellow-500"
                                                        } rounded-full items-center justify-center pl-1 pr-2 whitespace-nowrap shrink-0`}
                                                    >
                                                        {sentiment ===
                                                        "positive" ? (
                                                            <FaPlus className="text-white text-xs mr-1 dark:text-black" />
                                                        ) : sentiment ===
                                                          "negative" ? (
                                                            <FiMinus className="text-white mr-1 dark:text-black" />
                                                        ) : (
                                                            <GoDot className="text-white dark:text-black text-xl" />
                                                        )}
                                                        <span className="text-white dark:text-black text-sm">
                                                            {sentiment}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="break-all whitespace-pre-wrap">
                                                {processComment(
                                                    comment.content
                                                )}
                                            </div>

                                            <div className="flex items-center">
                                                <Button
                                                    onClick={() =>
                                                        toggleCommentLike({
                                                            commentId:
                                                                comment._id,
                                                            index,
                                                        })
                                                    }
                                                    variant="ghost"
                                                    className="rounded-full p-2"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <ThumbsUp
                                                            fill={
                                                                likeStatusOfComments &&
                                                                likeStatusOfComments[
                                                                    index
                                                                ]
                                                                    ? theme ==
                                                                      "dark"
                                                                        ? "white"
                                                                        : "black"
                                                                    : theme ==
                                                                      "dark"
                                                                    ? "black"
                                                                    : "white"
                                                            }
                                                        />
                                                        {likesCountofComments[
                                                            index
                                                        ] === 0
                                                            ? ""
                                                            : likesCountofComments[
                                                                  index
                                                              ]}
                                                    </div>
                                                </Button>
                                                <Button
                                                    className="text-sm rounded-full"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setReplyingToCommentId(
                                                            comment._id
                                                        )
                                                    }
                                                >
                                                    reply
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    {userData?._id === comment.creator._id && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild className="focus:outline-none">
                                                <EllipsisVertical className="cursor-pointer h-5 mt-2" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-white dark:bg-[#212121] p-0">
                                                <DropdownMenuItem
                                                    className="rounded-none dark:hover:bg-[#535353] hover:bg-[#E5E5E5] px-4 py-3"
                                                    onClick={() =>
                                                        setEditingCommentId(
                                                            comment._id
                                                        )
                                                    }
                                                >
                                                    <Edit className="h-5 w-5 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="rounded-none dark:hover:bg-[#535353] hover:bg-[#E5E5E5] px-4 py-3"
                                                    onClick={() => {
                                                        dispatch(
                                                            setAlertDialogData({
                                                                open: true,
                                                                message:
                                                                    "this will delete your comment permanently",
                                                                onConfirm: () =>
                                                                    deleteComment(
                                                                        comment._id
                                                                    ),
                                                            })
                                                        );
                                                    }}
                                                >
                                                    <div className="flex gap-2">
                                                        <Trash className="h-5 w-5" />
                                                        <span>Delete</span>
                                                    </div>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                                <div className="ml-12">
                                    {replyingToCommentId === comment._id && (
                                        <TextArea
                                            fullname="userData?.fullname"
                                            userAvatar={userData?.avatar}
                                            placeholder="Add a reply..."
                                            onSubmit={(content) => {
                                                addReply(content);
                                                comment.repliesCount += 1;
                                            }}
                                            onCancel={() =>
                                                setReplyingToCommentId(null)
                                            }
                                            submitLabel="Reply"
                                        />
                                    )}
                                    {comment.repliesCount > 0 && (
                                        <Collapsible
                                            onOpenChange={(open) => {
                                                const updatedRepliesOpen = [
                                                    ...isRepliesOpen,
                                                ];
                                                updatedRepliesOpen[index] =
                                                    open;
                                                setIsRepliesOpen(
                                                    updatedRepliesOpen
                                                );
                                            }}
                                        >
                                            <CollapsibleTrigger asChild>
                                                <Button
                                                    className="rounded-full flex space-x-1 text-indigo-500 hover:bg-indigo-500/30"
                                                    variant="ghost"
                                                >
                                                    {isRepliesOpen[index] ? (
                                                        <ChevronUp />
                                                    ) : (
                                                        <ChevronDown />
                                                    )}
                                                    <span>{`${
                                                        comment.repliesCount
                                                    } ${
                                                        comment.repliesCount ==
                                                        1
                                                            ? "reply"
                                                            : "replies"
                                                    }`}</span>
                                                </Button>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <Replies
                                                    playerRef={playerRef}
                                                    commentId={comment._id}
                                                />
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="flex items-center justify-center">
                {isFetchingNextPage && (
                    <Loader2 className="h-10 w-10 animate-spin" />
                )}
            </div>
        </div>
    );
};
