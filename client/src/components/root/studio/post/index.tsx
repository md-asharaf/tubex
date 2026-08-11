import { Outlet } from "react-router-dom";
import { SidebarLayout } from "../sidebar/sidebar-layout";
import { PostSection } from "./post-section";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postService } from "@/services/post";
import { IPostData } from "@/interfaces";
export const StudioPost = () => {
    const { id } = useParams();
    const { data: post, isLoading } = useQuery({
        queryKey: ["post", id],
        queryFn: async (): Promise<IPostData> => {
            const data = await postService.getPostById(id);
            return data.post;
        },
        enabled: !!id,
    });
    if (isLoading) return null;
    return (
        <div className="flex min-h-[100dvh] pt-[4rem]">
            <SidebarLayout>
                <PostSection
                    title={post.text}
                    thumbnail={post.images?.[0]}
                    id={post._id}
                    route="posts"
                />
            </SidebarLayout>
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};
