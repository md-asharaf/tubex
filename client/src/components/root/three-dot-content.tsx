import { Check, Clock4, Share2, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user";
import { queryClient } from "@/lib/query-client";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  setSaveToPlaylistDialog,
  setShareModalData,
  setLoginPopoverData,
} from "@/store/reducers/ui";
export const ThreeDotContent = ({ videoId, task, isStudio }) => {
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
        {!isStudio && (
          <>
            <li
              className="flex items-center space-x-2 cursor-pointer py-2 px-4 dark:hover:bg-[#535353] hover:bg-[#E5E5E5]"
              onClick={() => {
                if (!userId) {
                  dispatch(setLoginPopoverData({ open: true, message: "Sign in to save." }));
                  return;
                }
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
              onClick={() => {
                if (!userId) {
                  dispatch(setLoginPopoverData({ open: true, message: "Sign in to save." }));
                  return;
                }
                dispatch(setSaveToPlaylistDialog({ open: true, id: videoId }));
              }}
            >
              <div className="flex items-center space-x-2 py-2 px-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-list-plus"
                >
                  <path d="M11 12H3" />
                  <path d="M16 6H3" />
                  <path d="M16 18H3" />
                  <path d="M18 9v6" />
                  <path d="M21 12h-6" />
                </svg>
                <span>Save to Playlist</span>
              </div>
            </li>
          </>
        )}
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
