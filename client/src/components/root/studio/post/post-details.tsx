import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { postService } from "@/services/post";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { IPostData } from "@/interfaces";

export const PostDetails = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: async (): Promise<IPostData> => {
      const data = await postService.getPostById(id as string);
      return data.post;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (post) {
      setText(post.text || "");
    }
  }, [post]);

  const { mutate: updatePost, isPending } = useMutation({
    mutationFn: async () => {
      await postService.updatePost(id as string, {
        ...post,
        text,
      });
    },
    onSuccess: () => {
      toast.success("Post updated successfully");
      queryClient.invalidateQueries({ queryKey: ["post", id] });
    },
    onError: () => {
      toast.error("Failed to update post");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="flex flex-col gap-4 px-6 py-4 max-w-[1300px]">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-semibold">Post Details</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            disabled={text === post.text}
            className="font-semibold text-muted-foreground hover:bg-transparent"
            onClick={() => setText(post.text)}
          >
            Undo changes
          </Button>
          <Button
            disabled={!text || isPending || text === post.text}
            className="rounded-sm bg-[#3ea6ff] hover:bg-[#3ea6ff]/90 text-black font-semibold h-9 px-4"
            onClick={() => updatePost()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid-cols-1 lg:grid-cols-5 gap-4 grid">
        <div className="lg:col-span-3 space-y-6">
          <div className="relative border border-zinc-300 dark:border-[#3f3f3f] rounded-sm p-2 focus-within:border-[#3ea6ff] focus-within:ring-1 focus-within:ring-[#3ea6ff] transition-all bg-transparent">
            <Label htmlFor="text" className="text-xs text-muted-foreground px-1 font-normal mb-1 block">Content</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-1 text-base bg-transparent shadow-none min-h-[160px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};