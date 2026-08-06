import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postService } from "@/services/post";
import { PostCard } from "./post-card";
import { Comments } from "../comments";
import { Loader2 } from "lucide-react";
import { IPostData } from "@/interfaces";
import { useRef } from "react";

export const Post = () => {
    const { id } = useParams();
    const playerRef = useRef(null);

    const { data: post, isLoading, isError, error } = useQuery<IPostData>({
        queryKey: ["post", id],
        queryFn: async () => {
            const res = await postService.getPostById(id as string);
            return res.post;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center w-full min-h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex justify-center items-center w-full min-h-[50vh] text-red-500">
                {error?.message || "Failed to load post"}
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex justify-center items-center w-full min-h-[50vh]">
                Post not found
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row w-full max-w-[1200px] mx-auto gap-6 p-4">
            <div className="w-full lg:w-[65%] flex flex-col items-center">
                <PostCard post={post} />
                <div className="w-full max-w-[800px] mt-4">
                    <Comments
                        id={post._id}
                        type="post"
                        creatorId={post.creator._id}
                        playerRef={playerRef}
                        filter="top"
                    />
                </div>
            </div>
            
            <div className="hidden lg:block w-[35%]">
                {/* Related Posts or Sidebar can go here */}
            </div>
        </div>
    );
};
