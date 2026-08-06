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
import { postService } from "@/services/post";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { setAlertDialogData } from "@/store/reducers/ui";
import { toast } from "sonner";
import { queryClient } from "@/main";
import { ThreeDots } from "@/components/root/three-dots";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IStudioPost } from "@/interfaces";

export const ContentPosts = () => {
  const { username } = useParams();
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { mutate: deletePost } = useMutation({
    mutationFn: async (postId: string) => {
      await postService.deletePost(postId);
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["posts", username],
      });
    },
    onError: () => {
      toast.error("Failed to delete post");
    }
  });

  const handleDelete = (postId: string) => {
    dispatch(
      setAlertDialogData({
        open: true,
        message: "Delete Post",
        onConfirm: () => deletePost(postId),
      })
    );
  };

  const { data: postsPages } = useInfiniteQuery({
    queryKey: ["posts", username],
    queryFn: async ({
      pageParam,
    }): Promise<{
      docs: IStudioPost[];
      totalPages: number;
      hasNextPage: boolean;
    }> => {
      const data = await studioService.getUserPosts(username, pageParam);
      return data.posts;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasNextPage ? pages.length + 1 : undefined;
    },
  });
  const posts = postsPages?.pages.flatMap((p) => p.docs) || [];
  const totalPages = postsPages?.pages[0]?.totalPages || 0;
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Post</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Likes</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post, index) => (
            <TableRow
              key={index}
              onClick={() =>
                navigate(`/studio/post/${post._id}`)
              }
            >
              <TableCell>
                <div className="flex items-start gap-4 max-w-96">
                  <img
                    src={post.imageUrl}
                    alt="post"
                    className="w-32 aspect-video rounded-full"
                  />
                  <p className="line-clamp-2 text-sm">
                    {post.content}
                  </p>
                </div>
              </TableCell>
              <TableCell>{post.type}</TableCell>
              <TableCell>{post.visibility}</TableCell>
              <TableCell>
                {new Date(post.createdAt).toLocaleDateString(
                  "en-GB",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </TableCell>
              <TableCell>{post.comments}</TableCell>
              <TableCell>{post.likes}</TableCell>
              <TableCell>
                <ThreeDots
                  videoId={post._id}
                  task={{
                    title: "Delete Forever",
                    handler: () => handleDelete(post._id),
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
