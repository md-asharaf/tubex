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
import { ResponsiveModal } from "@/components/root/modals/responsive-modal";
export const VideoComments = ({ videoId, playerRef, creatorId, isDrawer = false, open = false, onOpenChange = (open: boolean) => { } }) => {
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
      queryClient.invalidateQueries({
        queryKey: ["comments", videoId, filter],
      });
      queryClient.invalidateQueries({
        queryKey: ["comments-count", videoId],
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
  const TitleContent = (
    <div className="flex sm:space-x-16 items-center justify-between sm:justify-normal w-full">
      <div className="font-bold text-[18px] sm:text-2xl text-foreground sm:text-zinc-600 sm:dark:text-zinc-300">
        <span className="sm:hidden">Comments {totalComments}</span>
        <span className="hidden sm:inline">{`${totalComments} Comments`}</span>
      </div>
      <Filter onFilterChange={setFilter} />
    </div>
  );

  const DrawerContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 pb-20">
        <Comments
          id={videoId}
          creatorId={creatorId}
          playerRef={playerRef}
          filter={filter}
          type="video"
        />
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#212121] p-3 border-t border-gray-200 dark:border-white/10 z-[60]">
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

  if (isDrawer) {
    return (
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        title={TitleContent}
        className="h-[80vh]"
      >
        {DrawerContent}
      </ResponsiveModal>
    );
  }

  return (
    <div className="space-y-2 flex flex-col h-full relative">
      <div className="mb-3 sm:mb-0">
        {TitleContent}
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
    </div>
  );
};
