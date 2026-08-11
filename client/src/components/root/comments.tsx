import { commentService } from "@/services/comment";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { getRelativeShortTime } from "@/lib/time";
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
  Edit,
  EllipsisVertical,
  Loader2,
  MessageSquare,
  ThumbsUp,
  Trash,
  ArrowLeft,
  X,
  Share2,
  ChevronRight,
} from "lucide-react";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { ResponsiveModal } from "./modals/responsive-modal";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { ThreadTrunk, ThreadBranch, ThreadLine } from "./thread-line";
import { queryClient } from "@/lib/query-client";
import { useIntersection } from "@mantine/hooks";
import { processText } from "@/lib";
import { setAlertDialogData, setShareModalData } from "@/store/reducers/ui";
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
  const [repliesDrawerComment, setRepliesDrawerComment] = useState<IComment | null>(null);
  const isMobile = useIsMobile();
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
        filter,
        userData?._id
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
      queryClient.setQueryData(
        ["comments", id, filter],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any, index: number) => {
              const newTotalDocs = index === 0 ? page.totalDocs - 1 : page.totalDocs;
              return {
                ...page,
                totalDocs: newTotalDocs,
                docs: page.docs.filter(
                  (comment: any) => comment._id !== commentId
                ),
              };
            }),
          };
        }
      );
    },
  });
  const { mutate: updateComment } = useMutation({
    mutationFn: async (content: string) => {
      await commentService.updateComment(editingCommentId, content);
    },
    onSuccess: (_, content) => {
      queryClient.setQueryData(
        ["comments", id, filter],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              docs: page.docs.map((comment: any) => {
                if (comment._id === editingCommentId) {
                  return { ...comment, content };
                }
                return comment;
              }),
            })),
          };
        }
      );
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
    <div className="flex flex-col space-y-4 sm:space-y-5 w-full">
      {comments?.map((comment, index) => {
        const sentiment = comment.sentiment?.toLowerCase();
        return (
          <div
            key={index}
            id={`comment-${comment._id}`}
            ref={index === comments.length - 1 ? ref : null}
            className="w-full"
          >
            {editingCommentId === comment._id && !isMobile ? (
              <TextArea
                fullname={userData?.fullname}
                userAvatar={userData?.avatar}
                initialValue={comment.content}
                onSubmit={(content) => updateComment(content)}
                onCancel={() => setEditingCommentId(null)}
                submitLabel="Save"
                autoFocus={true}
              />
            ) : (
              <>
                <ThreadTrunk
                  className="w-full max-w-full z-0"
                  topClassName="top-[30px]"
                  showLine={comment.repliesCount > 0}
                >
                  <div className="flex justify-between group relative z-10">
                    <div className="flex space-x-3 items-start w-full">
                      <AvatarImg
                        className="rounded-full h-7 w-7 shrink-0 cursor-pointer mt-0.5"
                        onClick={() =>
                          navigate(
                            `/channel/${comment.creator?.username}`
                          )
                        }
                        fullname={comment.creator.fullname}
                        avatar={comment.creator.avatar}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-x-2 flex-wrap">
                          <div
                            onClick={() =>
                              navigate(
                                `/channel/${comment.creator.username}`
                              )
                            }
                            className="text-[13px] sm:text-sm font-bold cursor-pointer truncate max-w-[140px] sm:max-w-xs"
                          >
                            {`@${comment.creator.username}`}
                          </div>
                          <div className="text-muted-foreground text-[12px]">
                            {getRelativeShortTime(comment.createdAt)}
                          </div>
                          {userData?._id ===
                            creatorId && (
                              <div
                                className={`flex ${sentiment ===
                                  "positive" &&
                                  "bg-green-500"
                                  } ${sentiment ===
                                  "negative" &&
                                  "bg-red-500"
                                  } ${sentiment ===
                                  "neutral" &&
                                  "bg-yellow-500"
                                  } rounded-full items-center justify-center pl-1 pr-2 whitespace-nowrap shrink-0 ml-1`}
                              >
                                {sentiment ===
                                  "positive" ? (
                                  <FaPlus className="text-white text-[10px] mr-1" />
                                ) : sentiment ===
                                  "negative" ? (
                                  <FiMinus className="text-white text-[10px] mr-1" />
                                ) : (
                                  <GoDot className="text-black text-sm mr-1" />
                                )}
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${sentiment === "neutral" ? "text-black" : "text-white"}`}>
                                  {sentiment}
                                </span>
                              </div>
                            )}
                        </div>
                        <div className="break-words whitespace-pre-wrap text-[14px] sm:text-[15px] leading-snug mt-0.5 text-foreground">
                          {processComment(
                            comment.content
                          )}
                        </div>

                        <div className="flex items-center mt-1 -ml-2">
                          <Button
                            onClick={() =>
                              toggleCommentLike({
                                commentId:
                                  comment._id,
                                index,
                              })
                            }
                            variant="ghost"
                            className="rounded-full h-8 px-2 text-xs"
                          >
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <ThumbsUp
                                size={16}
                                fill={
                                  likeStatusOfComments &&
                                    likeStatusOfComments[
                                    index
                                    ]
                                    ? theme ==
                                      "dark"
                                      ? "white"
                                      : "black"
                                    : "transparent"
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
                            className="h-8 w-8 rounded-full p-0 flex items-center justify-center ml-2"
                            variant="ghost"
                            onClick={() => {
                              if (isMobile) {
                                setRepliesDrawerComment(comment);
                                setTimeout(() => {
                                  window.dispatchEvent(new CustomEvent("setReplyUsername", { detail: "" }));
                                }, 300);
                              } else {
                                setReplyingToCommentId(comment._id);
                              }
                            }}
                          >
                            <MessageSquare size={16} className="text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild className="focus:outline-none">
                        <EllipsisVertical className="cursor-pointer h-5 w-5 mt-1 shrink-0 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white dark:bg-[#212121] p-0">
                        {userData?._id === comment.creator._id && (
                          <>
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
                          </>
                        )}
                        <DropdownMenuItem
                          className="rounded-none dark:hover:bg-[#535353] hover:bg-[#E5E5E5] px-4 py-3"
                          onClick={() => {
                            dispatch(setShareModalData({
                              open: true,
                              id: comment._id,
                              type: "comment",
                              parentId: id,
                              parentType: type
                            }));
                          }}
                        >
                          <Share2 size={16} className="mr-2" />
                          Share
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="relative z-10">
                    {(!isMobile && replyingToCommentId === comment._id) && (
                      <div className="pl-11 mt-2">
                        <TextArea
                          fullname={userData?.fullname}
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
                          autoFocus={true}
                        />
                      </div>
                    )}
                  </div>
                </ThreadTrunk>
                {comment.repliesCount > 0 && (
                  isMobile ? (
                    <div
                      className="relative pl-12 py-1.5 flex items-center cursor-pointer"
                      onClick={() => setRepliesDrawerComment(comment)}
                    >
                      <ThreadBranch />
                      <div className="flex items-center space-x-1.5 font-bold text-[14px]">
                        <span>{comment.repliesCount} {comment.repliesCount == 1 ? "reply" : "replies"}</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  ) : (
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
                        <div className="relative pl-8 pb-2 cursor-pointer w-fit">
                          {isRepliesOpen[index] ? (
                            <ThreadLine />
                          ) : (
                            <ThreadBranch />
                          )}
                          <Button
                            className="rounded-full flex space-x-1 h-8 px-3"
                            variant="ghost"
                          >
                            <span>{`${comment.repliesCount
                              } ${comment.repliesCount ==
                                1
                                ? "reply"
                                : "replies"
                              }`}</span>
                            {isRepliesOpen[index] ? (
                              <ChevronDown />
                            ) : (
                              <ChevronRight />
                            )}
                          </Button>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Replies
                          playerRef={playerRef}
                          commentId={comment._id}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  )
                )}
              </>
            )}
          </div>
        )
      })}

      <div className="flex items-center justify-center">
        {isFetchingNextPage && (
          <Loader2 className="h-10 w-10 animate-spin" />
        )}
      </div>

      {isMobile && repliesDrawerComment && (() => {
        const drawerCommentIndex = comments?.findIndex(c => c._id === repliesDrawerComment._id);
        return (
          <ResponsiveModal
            title={
              <div className="flex items-center w-full">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={() => setRepliesDrawerComment(null)}>
                    <ArrowLeft strokeWidth={1.5} />
                  </Button>
                  <span className="text-[18px] font-bold">Replies</span>
                </div>
              </div>
            }
            open={!!repliesDrawerComment}
            onOpenChange={(open) => {
              if (!open) {
                const commentId = repliesDrawerComment._id;
                setRepliesDrawerComment(null);
                setTimeout(() => {
                  document.getElementById(`comment-${commentId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 300);
              }
            }}
            className="h-[90vh]"
            nested={true}
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 pb-20 sm:px-0">
                <div className="bg-gray-100 dark:bg-[#282828] rounded-xl pb-1 mb-3">
                  <ThreadTrunk
                    className="max-w-full z-0"
                    topClassName="top-[30px] sm:top-[44px]"
                    showLine={repliesDrawerComment.repliesCount > 0}
                  >
                    <div className="flex justify-between group pb-3">
                      <div className="flex space-x-3 items-start w-full">
                        <AvatarImg
                          className="rounded-full h-7 w-7 sm:h-10 sm:w-10 shrink-0 cursor-pointer mt-0.5"
                          onClick={() => navigate(`/channel/${repliesDrawerComment.creator?.username}`)}
                          fullname={repliesDrawerComment.creator.fullname}
                          avatar={repliesDrawerComment.creator.avatar}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-x-2 flex-wrap">
                            <div
                              onClick={() => navigate(`/channel/${repliesDrawerComment.creator.username}`)}
                              className="text-[13px] sm:text-sm font-bold cursor-pointer truncate max-w-[140px] sm:max-w-xs"
                            >
                              {`@${repliesDrawerComment.creator.username}`}
                            </div>
                            <div className="text-muted-foreground text-[12px] whitespace-nowrap">
                              {getRelativeShortTime(repliesDrawerComment.createdAt)}
                            </div>
                            {userData?._id === creatorId && (
                              <div
                                className={`flex ${repliesDrawerComment.sentiment?.toLowerCase() === "positive" && "bg-green-500"} ${repliesDrawerComment.sentiment?.toLowerCase() === "negative" && "bg-red-500"} ${repliesDrawerComment.sentiment?.toLowerCase() === "neutral" && "bg-yellow-500"} rounded-full items-center justify-center pl-1 pr-2 whitespace-nowrap shrink-0 ml-1`}
                              >
                                {repliesDrawerComment.sentiment?.toLowerCase() === "positive" ? (
                                  <FaPlus className="text-white text-[10px] mr-1" />
                                ) : repliesDrawerComment.sentiment?.toLowerCase() === "negative" ? (
                                  <FiMinus className="text-white text-[10px] mr-1" />
                                ) : (
                                  <GoDot className="text-black text-sm mr-1" />
                                )}
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${repliesDrawerComment.sentiment?.toLowerCase() === "neutral" ? "text-black" : "text-white"}`}>
                                  {repliesDrawerComment.sentiment?.toLowerCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="break-words whitespace-pre-wrap text-[14px] sm:text-[15px] leading-snug mt-0.5 text-foreground">
                            {processComment(repliesDrawerComment.content)}
                          </div>
                          <div className="flex items-center mt-1 -ml-2">
                            <Button
                              onClick={() => {
                                if (drawerCommentIndex !== undefined && drawerCommentIndex !== -1) {
                                  toggleCommentLike({ commentId: repliesDrawerComment._id, index: drawerCommentIndex });
                                }
                              }}
                              variant="ghost"
                              className="rounded-full h-8 px-2 text-xs"
                            >
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <ThumbsUp
                                  size={16}
                                  fill={
                                    drawerCommentIndex !== undefined && drawerCommentIndex !== -1 && likeStatusOfComments && likeStatusOfComments[drawerCommentIndex]
                                      ? theme == "dark" ? "white" : "black"
                                      : "transparent"
                                  }
                                />
                                {drawerCommentIndex !== undefined && drawerCommentIndex !== -1 && likesCountofComments && likesCountofComments[drawerCommentIndex] > 0
                                  ? likesCountofComments[drawerCommentIndex]
                                  : ""}
                              </div>
                            </Button>
                            <Button
                              className="h-8 w-8 rounded-full p-0 flex items-center justify-center ml-2 text-muted-foreground"
                              variant="ghost"
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent("setReplyUsername", { detail: "" }));
                              }}
                            >
                              <MessageSquare size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ThreadTrunk>
                  <Replies
                    playerRef={playerRef}
                    commentId={repliesDrawerComment._id}
                  />
                </div>
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#212121] p-3 border-t border-gray-200 dark:border-white/10 z-[60]">
                  <TextArea
                    hideAvatar={true}
                    fullname={userData?.fullname}
                    userAvatar={userData?.avatar}
                    placeholder={`Reply to @${repliesDrawerComment.creator.username}...`}
                    onSubmit={(content) => {
                      replyService.addReply(repliesDrawerComment._id, content).then(() => {
                        toast.success("Reply added");
                        queryClient.invalidateQueries({ queryKey: ["replies", repliesDrawerComment._id] });
                      });
                    }}
                    submitLabel="Reply"
                  />
                </div>
              </div>
            </div>
          </ResponsiveModal>
        )
      })()}

      {isMobile && editingCommentId && (() => {
        const commentToEdit = comments?.find(c => c._id === editingCommentId);
        if (!commentToEdit) return null;
        return (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#212121] p-3 border-t border-gray-200 dark:border-white/10 z-[70] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-semibold text-muted-foreground">Editing comment</span>
              <X className="w-4 h-4 text-muted-foreground cursor-pointer" onClick={() => setEditingCommentId(null)} />
            </div>
            <TextArea
              hideAvatar={true}
              fullname={userData?.fullname}
              userAvatar={userData?.avatar}
              initialValue={commentToEdit.content}
              onSubmit={(content) => updateComment(content)}
              onCancel={() => setEditingCommentId(null)}
              submitLabel="Save"
            />
          </div>
        );
      })()}
    </div>
  );
};