import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { IShortData, IVideoData } from "@/interfaces";
import { userService } from "@/services/user";
import { Button } from "@/components/ui/button";
import { MdDelete } from "react-icons/md";
import { Loader2 } from "lucide-react";
import { formatDuration, formatViews } from "@/lib/utils";
import { ThreeDots } from "@/components/root/three-dots";
import { toast } from "sonner";
import { RootState } from "@/store/store";
import { setAlertDialogData } from "@/store/reducers/ui";
import { queryClient } from "@/main";

export const WatchHistory = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.auth.userData?._id);
  const {
    data: watchHistory,
    isError,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["watch-history", userId],
    queryFn: async (): Promise<{
      shorts: IShortData[];
      videos: IVideoData[];
    }> => {
      const data = await userService.getWatchHistory();
      return data.watchHistory;
    },
    enabled: !!userId,
  });
  const videos = watchHistory?.videos;
  const shorts = watchHistory?.shorts;
  const { mutate: clearAllHistory } = useMutation({
    mutationFn: async () => {
      await userService.clearWatchHistory();
    },
    onSuccess: () => {
      refetch();
      toast.success("Cleared all history");
      return true;
    },
  });
  const { mutate: remove } = useMutation({
    mutationFn: async ({ videoId }: { videoId: string }) => {
      await userService.removeFromWatchHistory(videoId, "video");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["watch-history", userId],
      });
    },
  });
  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError) {
    return <div>ERROR: {error.message}</div>;
  }
  return (
    <div className="w-full">
      <div className="flex justify-between items-center px-2 sm:px-4 mb-2">
        <div className="text-2xl sm:text-3xl">
          {videos?.length > 0 ? "Watch History" : "No History"}
        </div>
        <Button
          variant="secondary"
          className="flex justify-center items-center h-10 [&_svg]:size-7"
          onClick={() =>
            dispatch(
              setAlertDialogData({
                open: true,
                message:
                  "This will delete all your watch history permanently",
                onConfirm: () => clearAllHistory(),
              })
            )
          }
          disabled={videos?.length === 0}
        >
          <span>Clear history</span>
          <MdDelete size={10} color="red" />
        </Button>
      </div>
      <hr className="mb-2" />
      <div className="flex flex-col w-full">
        {videos?.map((video) => (
          <div
            className="flex items-start justify-between mb-4"
            key={video._id}
          >
            <Link
              to={`/video/${video._id}`}
              className="w-full sm:w-3/4 flex flex-col gap-4 p-2 sm:flex-row rounded-lg overflow-hidden"
            >
              <div className="relative w-64 min-w-64">
                <img
                  src={video.thumbnail}
                  className="h-full w-full object-cover aspect-video rounded-lg"
                  loading="lazy"
                />
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </span>
              </div>

              <div className="overflow-hidden">
                <h3 className="font-normal text-[16px] sm:text-[18px] leading-snug line-clamp-2 mb-1">
                  {video.title}
                </h3>
                <p className="text-[14px] text-muted-foreground">
                  {`${video.creator.fullname} • ${formatViews(
                    video.views
                  )}`}
                </p>
              </div>
            </Link>
            <div className="mr-8 md:mr-16 lg:mr-32 mt-4">
              <ThreeDots
                videoId={video._id}
                task={{
                  title: "Remove from Watch history",
                  handler: () =>
                    remove({ videoId: video._id }),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
