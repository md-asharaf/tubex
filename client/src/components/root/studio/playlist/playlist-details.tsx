import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { playlistService } from "@/services/playlist";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export const PlaylistDetails = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");

  const { data: playlist, isLoading } = useQuery({
    queryKey: ["playlist", id],
    queryFn: async (): Promise<any> => {
      const data = await playlistService.getPlaylistById(id as string);
      return data.playlist;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (playlist) {
      setName(playlist.name || "");
      setDescription(playlist.description || "");
      setVisibility(playlist.visibility || "private");
    }
  }, [playlist]);

  const { mutate: updatePlaylist, isPending } = useMutation({
    mutationFn: async () => {
      await playlistService.updatePlaylist(id as string, {
        name,
        description,
        visibility,
      });
    },
    onSuccess: () => {
      toast.success("Playlist updated successfully");
      queryClient.invalidateQueries({ queryKey: ["playlist", id] });
    },
    onError: () => {
      toast.error("Failed to update playlist");
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

  return (
    <div className="flex flex-col gap-4 px-6 py-4 max-w-[1300px]">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-semibold">Playlist Details</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            disabled={name === playlist.name && description === playlist.description && visibility === playlist.visibility}
            className="font-semibold text-muted-foreground hover:bg-transparent"
            onClick={() => {
              setName(playlist.name || "");
              setDescription(playlist.description || "");
              setVisibility(playlist.visibility || "private");
            }}
          >
            Undo changes
          </Button>
          <Button
            disabled={!name || isPending || (name === playlist.name && description === playlist.description && visibility === playlist.visibility)}
            className="rounded-sm bg-[#3ea6ff] hover:bg-[#3ea6ff]/90 text-black font-semibold h-9 px-4"
            onClick={() => updatePlaylist()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid-cols-1 lg:grid-cols-5 gap-4 grid">
        <div className="lg:col-span-3 space-y-6">
          <div className="relative border border-zinc-300 dark:border-[#3f3f3f] rounded-sm p-2 focus-within:border-[#3ea6ff] focus-within:ring-1 focus-within:ring-[#3ea6ff] transition-all bg-transparent">
            <Label htmlFor="name" className="text-xs text-muted-foreground px-1 font-normal mb-1 block">Title (required)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Add a title that describes your playlist"
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-1 text-base bg-transparent shadow-none h-auto"
            />
          </div>

          <div className="relative border border-zinc-300 dark:border-[#3f3f3f] rounded-sm p-2 focus-within:border-[#3ea6ff] focus-within:ring-1 focus-within:ring-[#3ea6ff] transition-all bg-transparent">
            <Label htmlFor="description" className="text-xs text-muted-foreground px-1 font-normal mb-1 block">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your playlist"
              className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-1 text-base bg-transparent shadow-none min-h-[120px]"
            />
          </div>

          <div className="relative border border-zinc-300 dark:border-[#3f3f3f] rounded-sm p-2 focus-within:border-[#3ea6ff] focus-within:ring-1 focus-within:ring-[#3ea6ff] transition-all bg-transparent">
            <Label className="text-xs text-muted-foreground px-1 font-normal mb-1 block">Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="w-full border-0 focus:ring-0 focus:ring-offset-0 bg-transparent shadow-none">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};