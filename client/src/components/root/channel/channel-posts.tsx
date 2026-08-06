import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { IPostData } from "@/interfaces";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { postService } from "@/services/post";
import { PostCard } from "../post/post-card";
import { CreatePost } from "../post/create-post";
import { RootState } from "@/store/store";
import { Separator } from "@/components/ui/separator";
export const ChannelPosts = () => {
  const dispatch = useDispatch();
  const { username } = useParams();
  const currentUser = useSelector(
    (state: RootState) => state.auth.userData
  );
  const uname = currentUser?.username;
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", username],
    queryFn: async (): Promise<IPostData[]> => {
      const data = await postService.getUserPosts(username);
      return data.posts;
    },
    enabled: !!username,
  });
  return (
    <div className="p-2 space-y-12">
      {username === uname && (
        <>
          <CreatePost />
          <Separator className="max-w-4xl" />
        </>
      )}
      <div className="flex flex-col items-center gap-6 max-w-[800px] w-full">
        {isLoading ? (
          <div className="flex justify-center items-center w-full min-h-[50vh] col-span-full">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" strokeWidth={1.5} />
          </div>
        ) : (
          posts?.length > 0 ? posts.map((post, index) => (
            <PostCard post={post} key={index} />
          )) : "No posts"
        )}
      </div>
    </div>
  );
};
