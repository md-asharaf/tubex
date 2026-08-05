import { IPlaylist, Playlist } from "@/interfaces";
import { playlistService } from "@/services/playlist";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { queryClient } from "@/main";
import { RootState } from "@/store/store";
import { userService } from "@/services/user";
import {
  setCreatePlaylistDialog,
  setSaveToPlaylistDialog,
} from "@/store/reducers/ui";
import { ResponsiveModal } from "./responsive-modal";

export const SaveToPlaylist = () => {
  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.auth.userData);
  const userId = userData?._id;
  const username = userData?.username;
  const { id, open } = useSelector(
    (state: RootState) => state.ui.saveToplaylistModalData
  );
  const { data: playlists } = useQuery({
    queryKey: ["playlists", username],
    queryFn: async (): Promise<Playlist[]> => {
      const data = await playlistService.getAllPlaylists(username);
      return data.playlists;
    },
    enabled: !!username,
  });

  const { data: isSavedToWatchLater } = useQuery({
    queryKey: ["is-video-saved", id, userId],
    queryFn: async (): Promise<boolean> => {
      const data = await userService.isSavedToWatchLater(id, "video");
      return data.isSaved;
    },
    enabled: !!id && !!userId,
  });

  const { data: isSavedToPlaylists } = useQuery({
    queryKey: ["is-saved-statuses", id],
    queryFn: async (): Promise<boolean[]> => {
      const data = await playlistService.isSavedToPlaylists(id, "video");
      return data.isSaved;
    },
    enabled: !!id,
  });

  const { mutate: saveToWatchLater } = useMutation({
    mutationFn: async () => {
      await userService.saveToWatchLater(id, "video");
    },
    onMutate: () => {
      toast.success("Saved to watch later");
      queryClient.cancelQueries({
        queryKey: ["is-video-saved", id, userId],
      });
      queryClient.cancelQueries({ queryKey: ["watch-later", userId] });
      queryClient.setQueryData(["is-video-saved", id, userId], true);
      queryClient.setQueryData(
        ["watch-later", userId],
        (
          oldData: { videos: string[]; shorts: string[] } = {
            videos: [],
            shorts: [],
          }
        ) => {
          return { ...oldData, videos: [...oldData.videos, id] };
        }
      );
    },
    onError: (error) => {
      console.log(error);
      queryClient.cancelQueries({
        queryKey: ["is-video-saved", id, userId],
      });
      queryClient.cancelQueries({ queryKey: ["watch-later", userId] });
      queryClient.setQueryData(["is-video-saved", id, userId], false);
      queryClient.setQueryData(
        ["watch-later", userId],
        (
          oldData: { videos: string[]; shorts: string[] } = {
            videos: [],
            shorts: [],
          }
        ) => {
          return {
            ...oldData,
            videos: oldData.videos.filter((v) => v !== id),
          };
        }
      );
    },
  });

  const { mutate: removeFromWatchLater } = useMutation({
    mutationFn: async () => {
      await userService.removeFromWatchLater(id, "video");
    },
    onMutate: () => {
      toast.success("Removed from watch later");
      queryClient.cancelQueries({
        queryKey: ["is-video-saved", id, userId],
      });
      queryClient.setQueryData(["is-video-saved", id, userId], false);
    },
    onError: () => {
      queryClient.cancelQueries({
        queryKey: ["is-video-saved", id, userId],
      });
      queryClient.setQueryData(["is-video-saved", id, userId], true);
    },
  });

  const { mutate: addToPlaylist } = useMutation({
    mutationFn: async ({ playlistId }: { playlistId: string }) => {
      await playlistService.addToPlaylist(playlistId, id, "video");
    },
    onSuccess: (_, { playlistId }) => {
      const playlist = playlists?.find((p) => p._id === playlistId);
      toast.success(`Added to ${playlist?.name}`);
      queryClient.cancelQueries({ queryKey: ["is-saved-statuses", id] });
      queryClient.invalidateQueries({
        queryKey: ["playlist", playlistId],
      });
      queryClient.cancelQueries({ queryKey: ["playlists", username] });
      queryClient.setQueryData(
        ["is-saved-statuses", id],
        (oldData: boolean[] = []) => {
          return oldData.map((data, index) => {
            if (playlists[index]._id === playlistId) {
              return true;
            }
            return data;
          });
        }
      );
      queryClient.setQueryData(
        ["playlists", username],
        (oldData: Playlist[] = []) => {
          return oldData.map((playlist) => {
            if (playlist._id === playlistId) {
              playlist.videos.push(id);
            }
            return playlist;
          });
        }
      );
    },
  });

  const { mutate: removeFromPlaylist } = useMutation({
    mutationFn: async ({ playlistId }: { playlistId: string }) => {
      await playlistService.removeFromPlaylist(playlistId, id, "video");
    },
    onSuccess: (_, { playlistId }) => {
      const playlist = playlists?.find((p) => p._id === playlistId);
      toast.success(`Removed from ${playlist?.name}`);
      queryClient.cancelQueries({ queryKey: ["is-saved-statuses", id] });
      queryClient.cancelQueries({ queryKey: ["playlist", playlistId] });
      queryClient.cancelQueries({ queryKey: ["playlists", username] });
      queryClient.setQueryData(
        ["is-saved-statuses", id],
        (oldData: boolean[] = []) => {
          return oldData.map((data, index) => {
            if (playlists[index]._id === playlistId) {
              return false;
            }
            return data;
          });
        }
      );
      queryClient.setQueryData(
        ["playlist", playlistId],
        (oldData: IPlaylist) => {
          return {
            ...oldData,
            videos: oldData.videos.filter(
              (video) => video._id !== id
            ),
          };
        }
      );
      queryClient.setQueryData(
        ["playlists", username],
        (oldData: Playlist[] = []) => {
          return oldData.map((playlist) => {
            if (playlist._id === playlistId) {
              return {
                ...playlist,
                videos: playlist.videos.filter(
                  (videoId) => videoId !== id
                ),
              };
            }
            return playlist;
          });
        }
      );
    },
  });
  const closeDialog = () => {
    dispatch(setSaveToPlaylistDialog({ id: "", open: false }));
  };
  const handleOnNewPlaylistClick = () => {
    closeDialog();
    dispatch(setCreatePlaylistDialog(true));
  };
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={closeDialog}
      title="Save video to..."
      className="sm:max-w-60"
    >
      <div className="space-y-4">
        <div className="space-y-4">
          {userId && (
            <div className="flex items-center justify-between">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={isSavedToWatchLater}
                onChange={(e) => {
                  if (e.target.checked) {
                    saveToWatchLater();
                  } else {
                    removeFromWatchLater();
                  }
                }}
              />
              <span>Watch Later</span>
            </div>
          )}
          {playlists?.map((playlist, index) => (
            <div
              key={playlist._id}
              className="flex items-center justify-between"
            >
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={
                  isSavedToPlaylists &&
                  isSavedToPlaylists[index]
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    addToPlaylist({
                      playlistId: playlist._id,
                    });
                  } else {
                    removeFromPlaylist({
                      playlistId: playlist._id,
                    });
                  }
                }}
              />
              <span>{playlist.name}</span>
            </div>
          ))}
        </div>
        <Button
          size="sm"
          className="w-full justify-center rounded-lg"
          onClick={handleOnNewPlaylistClick}
        >
          <Plus /> New Playlist
        </Button>
      </div>
    </ResponsiveModal>
  );
};
