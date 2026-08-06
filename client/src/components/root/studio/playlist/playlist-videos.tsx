import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Video, Film, PlayCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { playlistService } from "@/services/playlist";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const PlaylistVideos = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: playlist, isLoading } = useQuery({
    queryKey: ["playlist", id],
    queryFn: async (): Promise<any> => {
      const data = await playlistService.getPlaylistById(id as string);
      return data.playlist;
    },
    enabled: !!id,
  });

  const { mutate: removeMedia, isPending } = useMutation({
    mutationFn: async ({ mediaId, type }: { mediaId: string, type: string }) => {
      await playlistService.removeFromPlaylist(id as string, mediaId, type);
    },
    onSuccess: () => {
      toast.success("Removed from playlist");
      queryClient.invalidateQueries({ queryKey: ["playlist", id] });
    },
    onError: () => {
      toast.error("Failed to remove from playlist");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!playlist) return null;

  const allMedia = [
    ...(playlist.videos?.map((v: any) => ({ ...v, mediaType: 'video' })) || []),
    ...(playlist.shorts?.map((s: any) => ({ ...s, mediaType: 'short' })) || [])
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex flex-col max-w-[1300px]">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold">Playlist videos</h1>
        </div>
      </div>

      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] font-semibold text-xs text-muted-foreground">Type</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground">Video</TableHead>
              <TableHead className="w-[120px] font-semibold text-xs text-muted-foreground">Visibility</TableHead>
              <TableHead className="text-right w-[100px] font-semibold text-xs text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allMedia.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No videos in this playlist yet.
                </TableCell>
              </TableRow>
            ) : (
              allMedia.map((media: any) => (
                <TableRow key={media._id}>
                  <TableCell>
                    {media.mediaType === 'video' ? (
                      <Video className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Film className="h-5 w-5 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative w-24 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                        {media.thumbnail ? (
                          <img src={media.thumbnail} alt="thumbnail" className="object-cover w-full h-full" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <PlayCircle className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{media.title || "Untitled"}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{media.description || "No description"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="capitalize text-sm">{media.visibility}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      onClick={() => removeMedia({ mediaId: media._id, type: media.mediaType })}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};