import { useQuery } from "@tanstack/react-query";
import { Loader2, Video, Film } from "lucide-react";
import { useParams } from "react-router-dom";
import { playlistService } from "@/services/playlist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IPlaylist } from "@/interfaces";

export const PlaylistAnalytics = () => {
  const { id } = useParams();

  const { data: playlist, isLoading } = useQuery({
    queryKey: ["playlist", id],
    queryFn: async (): Promise<IPlaylist> => {
      const data = await playlistService.getPlaylistById(id as string);
      return data.playlist;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Content metrics for "{playlist.name}"
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playlist.videos?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Shorts</CardTitle>
            <Film className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playlist.shorts?.length || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};