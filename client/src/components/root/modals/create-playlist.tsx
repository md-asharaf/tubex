import { playlistService } from "@/services/playlist";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { queryClient } from "@/lib/query-client";
import { RootState } from "@/store/store";
import { setCreatePlaylistDialog } from "@/store/reducers/ui";
import { ResponsiveModal } from "./responsive-modal";

export const CreatePlaylist = () => {
    const dispatch = useDispatch();
    const username = useSelector((state: RootState) => state.auth.userData?.username);
    const [playlistName, setPlaylistName] = useState<string>("");
    const open = useSelector(
        (state: RootState) => state.ui?.isCreatePlaylistDialogOpen
    );
    const { mutate: createPlaylist } = useMutation({
        mutationFn: async () => {
            await playlistService.createPlaylist(playlistName);
        },
        onSuccess: () => {
            toast.success(`${playlistName} created`);
            queryClient.invalidateQueries({ queryKey: ["playlists", username] });
            setPlaylistName("");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create playlist");
        },
    });
    const closeDialog = () => {
        dispatch(setCreatePlaylistDialog(false));
    };
    return (
        <ResponsiveModal
            onOpenChange={closeDialog}
            open={open}
            title="Create Playlist"
            className="max-w-80"
        >
            <div className="flex flex-col items-start space-y-4">
                <Input
                    value={playlistName}
                    placeholder="Enter playlist name"
                    onChange={(e) => setPlaylistName(e.target.value)}
                />
                <div className="w-full flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={closeDialog}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                            createPlaylist();
                            closeDialog();
                        }}
                        disabled={!playlistName.trim()}
                    >
                        Create
                    </Button>
                </div>
            </div>
        </ResponsiveModal>
    );
};
