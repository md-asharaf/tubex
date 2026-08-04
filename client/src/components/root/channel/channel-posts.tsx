import { toggleMenu } from "@/store/reducers/ui";
import { Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
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
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex justify-center w-full">
            <Loader2 className="h-10 w-10 animate-spin" strokeWidth={1.5} />
          </div>
        ) : (
          posts?.length > 0 ? posts.map((post, index) => (
            <Link
              to={`/post/${post._id}`}
              onClick={() => dispatch(toggleMenu())}
              key={index}
              className="rounded-lg"
            >
              <PostCard post={post} />
            </Link>
          )):"No posts"
        )}
      </div>
    </div>
  );
};
