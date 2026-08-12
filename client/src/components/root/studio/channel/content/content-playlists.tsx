import {
  Pagination,
  PaginationNext,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { studioService } from "@/services/studio";
import { playlistService } from "@/services/playlist";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { setAlertDialogData } from "@/store/reducers/ui";
import { toast } from "sonner";
import { queryClient } from "@/lib/query-client";
import { ThreeDots } from "@/components/root/three-dots";
import { AlignJustifyIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IStudioPlaylist } from "@/interfaces";
export const ContentPlaylists = () => {
  const { username } = useParams();
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { mutate: deletePlaylist } = useMutation({
    mutationFn: async (playlistId: string) => {
      await playlistService.deletePlaylist(playlistId);
    },
    onSuccess: () => {
      toast.success("Playlist deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["playlists", username],
      });
    },
    onError: () => {
      toast.error("Failed to delete playlist");
    }
  });

  const handleDelete = (playlistId: string) => {
    dispatch(
      setAlertDialogData({
        open: true,
        message: "Delete Playlist",
        onConfirm: () => deletePlaylist(playlistId),
      })
    );
  };

  const { data: playlistsPages, isLoading } = useInfiniteQuery({
    queryKey: ["playlists", username, page],
    queryFn: async ({
      pageParam,
    }): Promise<{
      docs: IStudioPlaylist[];
      totalPages: number;
      hasNextPage: boolean;
    }> => {
      const data = await studioService.getUserPlaylists(username, pageParam);
      return data.playlists;
    },
    initialPageParam: page,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasNextPage ? pages.length + 1 : undefined;
    },
  });
  const playlists = playlistsPages?.pages.flatMap((p) => p.docs) || [];
  const totalPages = playlistsPages?.pages[0]?.totalPages || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Playlist</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Video Count</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {playlists.map((playlist, index) => (
            <TableRow
              key={index}
              onClick={() => navigate(`/studio/playlist/${playlist._id}`)}
            >
              <TableCell>
                <div className="flex items-start gap-4 max-w-96">
                  <div className="relative">
                    <img
                      src={playlist.thumbnail}
                      className="w-32 aspect-video object-cover rounded-xl"
                      loading="lazy"
                      alt="Empty playlist"
                    />
                    <p className="absolute right-1 bottom-1 bg-black text-white text-xs font-bold sm:py-1 sm:px-2 px-1 rounded flex items-center gap-1">
                      <span>{`${playlist.videoCount || 0}`}</span>
                      <AlignJustifyIcon className="size-3" />
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-bold line-clamp-1 text-sm">
                      {playlist.name}
                    </p>
                    <p className="line-clamp-2 text-xs">
                      {playlist.description}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{playlist.visibility}</TableCell>
              <TableCell>
                {new Date(playlist.updatedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell>{playlist.videoCount}</TableCell>
              <TableCell>
                <ThreeDots
                  videoId={playlist._id}
                  isStudio={true}
                  task={{
                    title: "Delete Forever",
                    handler: () => handleDelete(playlist._id),
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(1, page - 1))}
              hidden={page === 1}
            />
          </PaginationItem>
          <PaginationItem>
            Page {page} of {totalPages}
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              hidden={page === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
