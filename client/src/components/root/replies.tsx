import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { replyService } from "@/services/reply";
import { Button } from "@/components/ui/button";
import { Edit, EllipsisVertical, Loader2, ThumbsUp, Trash, MessageSquare, X } from "lucide-react";
import { useIntersection } from "@mantine/hooks";
import { formatDistanceToNowStrict } from "date-fns";
import { getRelativeShortTime } from "@/lib/time";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { likeService } from "@/services/like";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { TextArea } from "./text-area";
import { IReply } from "@/interfaces";
import { toast } from "sonner";
import { queryClient } from "@/main";
import { AvatarImg } from "./avatar-image";
import { processText } from "@/lib";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThreadBranch, ThreadLine } from "./thread-line";

const Replies = ({
  commentId,
  playerRef,
}: {
  commentId: string;
  playerRef: any;
}) => {
  const theme = useSelector((state: RootState) => state.theme.mode);
  const userData = useSelector((state: RootState) => state.auth?.userData);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const lastReplyRef = useRef(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [replyingToReplyId, setReplyingToReplyId] = useState<string | null>(
    null
  );
  const {
    data: repliesPages,
    isLoading: repliesLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["replies", commentId],
    queryFn: async ({
      pageParam,
    }): Promise<{
      docs: IReply[];
      hasNextPage: boolean;
    }> => {
      const data = await replyService.getReplies(commentId, pageParam);
      return data.replies;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length + 1 : undefined,
  });

  const replies = repliesPages?.pages.flatMap((page) => page.docs);
  const { data: likeStatusOfReplies, isLoading: likeStatusLoading } =
    useQuery({
      queryKey: ["replies-like-status", commentId],
      queryFn: async () => {
        const data = await likeService.getRepliesLikeStatus(commentId);
        return data.likedStatus;
      },
      enabled: !!userData && !!replies,
    });

  const { data: likesCountOfReplies, isLoading: likesCountLoading } =
    useQuery({
      queryKey: ["replies-likes-count", commentId],
      queryFn: async (): Promise<number[]> => {
        const data = await likeService.getRepliesLikesCount(commentId);
        return data.likesCount;
      },
      enabled: !!replies,
    });
  const { mutate: toggleReplyLike } = useMutation({
    mutationFn: async ({
      replyId,
      index,
    }: {
      replyId: string;
      index: number;
    }) => await likeService.toggleLike(replyId, "reply"),
    onMutate: ({ index }) => {
      queryClient.cancelQueries({
        queryKey: ["replies-like-status", commentId],
      });
      queryClient.cancelQueries({
        queryKey: ["replies-likes-count", commentId],
      });
      queryClient.setQueryData(
        ["replies-like-status", commentId],
        (prev: boolean[]) => {
          const updatedLikes = [...prev];
          updatedLikes[index] = !updatedLikes[index];
          return updatedLikes;
        }
      );
      queryClient.setQueryData(
        ["replies-likes-count", commentId],
        (prev: number[]) => {
          const updatedLikes = [...prev];
          updatedLikes[index] += updatedLikes[index] ? -1 : 1;
          return updatedLikes;
        }
      );
    },
    onError: ({ message }, { index }) => {
      queryClient.cancelQueries({
        queryKey: ["replies-like-status", commentId],
      });
      queryClient.cancelQueries({
        queryKey: ["replies-likes-count", commentId],
      });
      queryClient.setQueryData(
        ["replies-like-status", commentId],
        (prev: boolean[]) => {
          const updatedLikes = [...prev];
          updatedLikes[index] = !updatedLikes[index];
          return updatedLikes;
        }
      );
      queryClient.setQueryData(
        ["replies-likes-count", commentId],
        (prev: number[]) => {
          const updatedLikes = [...prev];
          updatedLikes[index] += updatedLikes[index] ? -1 : 1;
          return updatedLikes;
        }
      );
    },
  });
  const { mutate: deleteReply, isPending: isDeletionPending } = useMutation({
    mutationFn: async (replyId: string) =>
      await replyService.deleteReply(replyId),
    onSuccess: (data, replyId) => {
      queryClient.setQueryData(
        ["replies", commentId],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              docs: page.docs.filter((reply: any) => reply._id !== replyId)
            }))
          };
        }
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: updateReply, isPending: isUpdationPending } = useMutation({
    mutationFn: async (content: string) =>
      await replyService.updateReply(editingReplyId, content),
    onSuccess: (_, content) => {
      queryClient.setQueryData(
        ["replies", commentId],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              docs: page.docs.map((reply: any) => {
                if (reply._id === editingReplyId) {
                  return { ...reply, content };
                }
                return reply;
              })
            }))
          };
        }
      );
    },
    onSettled: () => {
      setEditingReplyId(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const { mutate: addReply, isPending: isAdditionPending } = useMutation({
    mutationFn: async (content: string) => {
      const data = await replyService.addReply(commentId, content);
      return data.reply;
    },
    onSuccess: () => {
      setReplyingToReplyId(null);
      queryClient.invalidateQueries({
        queryKey: ["replies", commentId],
        exact: true,
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const { ref, entry } = useIntersection({
    root: lastReplyRef.current,
    threshold: 1,
  });
  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [entry]);
  const processReply = (content: string) => processText(content, playerRef);
  if (repliesLoading || likesCountLoading || likeStatusLoading)
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  return (
    <div className="flex flex-col w-full overflow-y-auto overflow-x-hidden">
      {isDeletionPending && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      <div>
        {replies?.map((reply, index) => {
          const isLast = index === (replies?.length ?? 0) - 1;
          return (
            <div
              key={index}
              ref={isLast ? ref : null}
              className="relative pb-3 sm:pb-4"
            >
              <ThreadBranch />
              {!isLast && <ThreadLine topClassName="top-0" />}
              {editingReplyId === reply._id && !isMobile ? (
                isUpdationPending ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <TextArea
                    fullname={userData?.fullname}
                    userAvatar={userData?.avatar}
                    initialValue={reply.content}
                    onSubmit={(content) => updateReply(content)}
                    onCancel={() => setEditingReplyId(null)}
                    submitLabel="Save"
                  />
                )
              ) : (
                <div className="pl-11">
                  <div className="flex justify-between">
                    <div className="flex space-x-2 items-start">
                      <div
                        className="rounded-full h-6 w-6 shrink-0 cursor-pointer mt-0.5"
                        onClick={() => navigate(`/channel/${reply.creator.username}`)}
                      >
                        <AvatarImg
                          fullname={reply.creator.fullname}
                          avatar={reply.creator.avatar}
                          className="h-6 w-6"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-x-2 flex-wrap">
                          <div
                            onClick={() => navigate(`/channel/${reply.creator.username}`)}
                            className="text-[13px] font-bold cursor-pointer truncate max-w-[140px] sm:max-w-xs"
                          >
                            {`@${reply.creator.username}`}
                          </div>
                          <div className="text-muted-foreground text-[12px]">
                            {getRelativeShortTime(reply.createdAt)}
                          </div>
                        </div>
                        <div className="break-words whitespace-pre-wrap text-[14px] leading-snug mt-0.5 text-foreground">
                          {processReply(reply.content)}
                        </div>
                        <div className="flex items-center mt-1 -ml-2">
                          <Button
                            onClick={() => toggleReplyLike({ replyId: reply._id, index })}
                            variant="ghost"
                            className="rounded-full h-8 px-2 text-xs"
                          >
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <ThumbsUp
                                size={16}
                                fill={
                                  likeStatusOfReplies?.[index]
                                    ? theme === "dark" ? "white" : "black"
                                    : "transparent"
                                }
                              />
                              {likesCountOfReplies[index] === 0 ? "" : likesCountOfReplies[index]}
                            </div>
                          </Button>
                          <Button
                            className="h-8 w-8 rounded-full p-0 flex items-center justify-center ml-2"
                            variant="ghost"
                            onClick={() => {
                              if (isMobile) {
                                window.dispatchEvent(new CustomEvent("setReplyUsername", { detail: reply.creator.username }));
                              } else {
                                setReplyingToReplyId(reply._id);
                              }
                            }}
                          >
                            <MessageSquare size={16} className="text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {userData?._id === reply.creator._id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild className="focus:outline-none">
                          <EllipsisVertical className="cursor-pointer h-5 w-5 mt-1 shrink-0 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white dark:bg-[#212121] p-0 py-2">
                          <DropdownMenuItem
                            className="rounded-none dark:hover:bg-[#535353] hover:bg-[#E5E5E5] px-4 py-3"
                            onClick={() => setEditingReplyId(reply._id)}
                          >
                            <Edit className="h-5 w-5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-none dark:hover:bg-[#535353] hover:bg-[#E5E5E5] px-4 py-3"
                            onClick={() => deleteReply(reply._id)}
                          >
                            <Trash className="h-5 w-5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div>
                    {replyingToReplyId === reply._id && !isMobile && (
                      <div className="mt-2">
                        {isAdditionPending ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : (
                          <TextArea
                            fullname={userData?.fullname}
                            userAvatar={userData?.avatar}
                            initialValue={`@${reply.creator.username} `}
                            placeholder={`Reply to @${reply.creator.username}...`}
                            onSubmit={(content) => addReply(content)}
                            onCancel={() => setReplyingToReplyId(null)}
                            submitLabel="Reply"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center mb-10">
        {isFetchingNextPage && <Loader2 className="h-10 w-10 animate-spin" />}
      </div>
      {isMobile && editingReplyId && (() => {
        const replyToEdit = replies?.find(r => r._id === editingReplyId);
        if (!replyToEdit) return null;
        return (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#212121] p-3 border-t border-gray-200 dark:border-white/10 z-[70] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-semibold text-muted-foreground">Editing reply</span>
              <X className="w-4 h-4 text-muted-foreground cursor-pointer" onClick={() => setEditingReplyId(null)} />
            </div>
            <TextArea
              hideAvatar={true}
              fullname={userData?.fullname}
              userAvatar={userData?.avatar}
              initialValue={replyToEdit.content}
              onSubmit={(content) => updateReply(content)}
              onCancel={() => setEditingReplyId(null)}
              submitLabel="Save"
            />
          </div>
        );
      })()}
    </div>
  );
};

export default Replies;