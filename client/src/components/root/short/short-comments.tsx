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
import { ResponsiveModal } from "@/components/root/modals/responsive-modal";
import { useIsMobile } from "@/hooks/use-mobile";
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
      queryClient.invalidateQueries({
        queryKey: ["comments", shortId, filter],
      });
    },
  });
  const isMobile = useIsMobile();

  const TitleContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex gap-2">
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
      </div>
    </div>
  );

  const DrawerContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 pb-20 h-full">
        <Comments
          key={shortId}
          playerRef={playerRef}
          id={shortId}
          creatorId={creatorId}
          type="short"
          filter={filter}
        />
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#212121] p-3 border-t border-gray-200 dark:border-white/10 z-[60]">
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
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <ResponsiveModal
        open={true}
        onOpenChange={(open) => {
          if (!open) dispatch(setOpenCard(""));
        }}
        className="h-[75vh]"
        title={TitleContent}
      >
        {DrawerContent}
      </ResponsiveModal>
    );
  }

  return (
    <Card className="flex flex-col w-full h-full sm:w-[400px] rounded-t-3xl sm:rounded-lg rounded-b-none sm:rounded-b-lg border-0 sm:border shadow">
      <CardTitle className="flex items-center justify-between p-2 text-xl w-full">
        <div className="flex-1 pr-2">
          {TitleContent}
        </div>
        <X
          size={30}
          strokeWidth={0.7}
          onClick={() => dispatch(setOpenCard(""))}
          className="cursor-pointer shrink-0 ml-2"
        />
      </CardTitle>
      <Separator className="mb-2" />
      <CardContent className="flex-1 overflow-y-auto pb-16 px-2">
        <Comments
          key={shortId}
          playerRef={playerRef}
          id={shortId}
          creatorId={creatorId}
          type="short"
          filter={filter}
        />
      </CardContent>
      <Separator />
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
