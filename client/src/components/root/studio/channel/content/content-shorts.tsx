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
import { shortService } from "@/services/short";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAlertDialogData } from "@/store/reducers/ui";
import { toast } from "sonner";
import { queryClient } from "@/main";
import { ThreeDots } from "@/components/root/three-dots";
import { IStudioShort } from "@/interfaces";
export const ContentShorts = () => {
    const { username } = useParams();
    const [page, setPage] = useState(1);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { mutate: deleteShort } = useMutation({
        mutationFn: async (shortId: string) => {
            await shortService.deleteShort(shortId);
        },
        onSuccess: () => {
            toast.success("Short deleted successfully");
            queryClient.invalidateQueries({
                queryKey: ["shorts", username],
            });
        },
        onError: () => {
            toast.error("Failed to delete short");
        }
    });

    const handleDelete = (shortId: string) => {
        dispatch(
            setAlertDialogData({
                open: true,
                message: "Delete Short",
                onConfirm: () => deleteShort(shortId),
            })
        );
    };

    const { data: shortsPages } = useInfiniteQuery({
        queryKey: ["shorts", username, page],
        queryFn: async ({ pageParam }): Promise<{docs:IStudioShort[],totalPages:number,hasNextPage:boolean}> => {
            const data = await studioService.getUserShorts(username, pageParam);
            return data.shorts;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, pages) => {
            return lastPage.hasNextPage ? pages.length + 1 : undefined;
        },
    });
    const shorts = shortsPages?.pages.flatMap((p) => p.docs) || [];
    const totalPages = shortsPages?.pages[0]?.totalPages || 0;
    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Short</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Comments</TableHead>
                        <TableHead>Likes</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shorts.map((short, index) => (
                        <TableRow key={index} onClick={() => navigate(`/studio/short/${short._id}`)}>
                            <TableCell>
                                <div className="flex items-start gap-4 max-w-96">
                                    <img
                                        src={short.thumbnail}
                                        alt="short"
                                        className="aspect-video w-32 rounded-lg"
                                    />
                                    <div className="flex flex-col gap-1">
                                        <p className="font-bold line-clamp-1 text-sm">{short.title}</p>
                                        <p className="line-clamp-2 text-xs">{short.description}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{short.visibility}</TableCell>
                            <TableCell>{new Date(short.createdAt).toLocaleDateString(
                                    "en-GB",
                                    {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    }
                                )}</TableCell>
                            <TableCell>{short.views}</TableCell>
                            <TableCell>{short.comments}</TableCell>
                            <TableCell>{short.likes}</TableCell>
                            <TableCell>
                                <ThreeDots
                                    videoId={short._id}
                                    task={{
                                        title: "Delete Forever",
                                        handler: () => handleDelete(short._id),
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
                            onClick={() =>
                                setPage(Math.min(totalPages, page + 1))
                            }
                            hidden={page === totalPages}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
};
