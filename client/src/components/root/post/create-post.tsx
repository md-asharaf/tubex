import { Card, CardContent } from "@/components/ui/card";
import { AvatarImg } from "../avatar-image";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Button } from "@/components/ui/button";
import { v4 as uuid } from "uuid";
import {
    FilmIcon,
    ImageIcon,
    ListIcon,
    Loader2,
    SquareCheckBigIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ImageUploader } from "./image-uploader";
import { ImagePoll } from "./image-poll";
import { TextPoll } from "./text-poll";
import { Quiz } from "./quiz";
import { VideoPost } from "./video-post";
import { TextPost } from "./text-post";                                                    
import { postService } from "@/services/post";
import { toast } from "sonner";
import { queryClient } from "@/main";
import { uploadService } from "@/services/upload";
import { uploadToPresignedUrl } from "@/lib/upload";

const BUCKET = process.env.INPUT_BUCKET || "default-bucket-name";


export const CreatePost = ({ autoFocus = false }: { autoFocus?: boolean }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [postType, setPostType] = useState<
        "text" | "image" | "text-poll" | "image-poll" | "video" | "quiz"
    >("text");
    const [data, setData] = useState<any>({ text: "" });

    const { fullname, avatar, username } =
        useSelector((state: RootState) => state.auth.userData) || {};

    const generateAndUploadToPresignedUrl = async (
        file: File
    ): Promise<string> => {
        try {
            const fileExtension = file?.name.split(".").pop();
            const fileKey = `uploads/thumbnails/${uuid()}.${fileExtension}`;
            const { url } = await uploadService.getPutObjectPresignedUrl(
                fileKey,
                fileExtension,
                file?.type
            );
            await uploadToPresignedUrl(url, file);
            return `https://${BUCKET}.s3.ap-south-1.amazonaws.com/${fileKey}`;
        } catch (error) {
            throw error;
        }
    };

    const handleSubmit = async () => {
        setIsUploading(true);
        try {
            if (
                postType === "image" &&
                "images" in data &&
                data.images.length > 0
            ) {
                const promises = data.images.map((image: File) =>
                    generateAndUploadToPresignedUrl(image)
                );
                const urls = await Promise.all(promises);
                await postService.createPost({
                    ...data,
                    type: postType,
                    images: urls,
                });
            } else {
                await postService.createPost({
                    ...data,
                    type: postType,
                });
            }
            toast.success("Post created successfully");
            queryClient.invalidateQueries({ queryKey: ["posts", username] });
            reset();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const reset = () => {
        setPostType("text");
        setData({ type: "text", text: "" });
    };

    const isPostDisabled = () => {
        switch (postType) {
            case "text":
                return !data.text || data.text.trim() === "";
            case "image":
                return !data.images || data.images.length === 0;
            case "text-poll":
                return (
                    !data.text ||
                    data.text.trim() === "" ||
                    !data.options ||
                    data.options.length < 2 ||
                    data.options.some(
                        (opt: string) => !opt || opt.trim() === ""
                    )
                );
            case "image-poll":
                return (
                    !data.text ||
                    data.text.trim() === "" ||
                    !data.options ||
                    data.options.length < 2 ||
                    data.options.some(
                        (opt: { image: string; text: string }) =>
                            !opt.text ||
                            opt.text.trim() === "" ||
                            !opt.image ||
                            opt.image.trim() === ""
                    )
                );
            case "quiz":
                return (
                    !data.text ||
                    data.text.trim() === "" ||
                    !data.options ||
                    data.options.length < 2 ||
                    data.options.some(
                        (opt: string) => !opt || opt.trim() === ""
                    ) ||
                    data.correct === -1
                );
            case "video":
                return !data.video || data.video.trim() === "";
            default:
                return true;
        }
    };

    const Post = useMemo(() => {
        switch (postType) {
            case "image":
                return (
                    <ImageUploader
                        data={data}
                        setData={setData}
                        reset={reset}
                    />
                );
            case "image-poll":
                return (
                    <ImagePoll data={data} setData={setData} reset={reset} />
                );
            case "text-poll":
                return <TextPoll data={data} setData={setData} reset={reset} />;
            case "quiz":
                return <Quiz data={data} setData={setData} reset={reset} />;
            case "video":
                return <VideoPost data={data} setData={setData} />;
            case "text":
                return <TextPost data={data} setData={setData} autoFocus={autoFocus} />;
            default:
                return null;
        }
    }, [postType, data]);
    return (
        <Card className="max-w-4xl">
            <CardContent className="p-4">
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <AvatarImg
                                avatar={avatar}
                                fullname={fullname}
                                className="w-10 h-10"
                            />
                            <div className="flex flex-col">
                                <span className="font-bold text-[14px]">@{username}</span>
                            </div>
                        </div>
                        <div className="text-muted-foreground">
                            Visibility: Public
                        </div>
                    </div>
                    {Post ?? "loading"}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex justify-start items-center md:justify-normal">
                            <Button
                                variant={
                                    postType === "image" ? "secondary" : "ghost"
                                }
                                className="rounded-full"
                                onClick={() => {
                                    setPostType("image");
                                    setData({ text: "", images: [] });
                                }}
                            >
                                <ImageIcon className="mr-1" /> Image
                            </Button>
                            <Button
                                variant={
                                    postType === "image-poll"
                                        ? "secondary"
                                        : "ghost"
                                }
                                className="rounded-full"
                                onClick={() => {
                                    setPostType("image-poll");
                                    setData({
                                        text: "",
                                        options: [
                                            { image: "", text: "" },
                                            { image: "", text: "" },
                                        ],
                                    });
                                }}
                            >
                                <ListIcon className="mr-1" /> Image Poll
                            </Button>
                            <Button
                                variant={
                                    postType === "text-poll"
                                        ? "secondary"
                                        : "ghost"
                                }
                                className="rounded-full"
                                onClick={() => {
                                    setPostType("text-poll");
                                    setData({ text: "", options: ["", ""] });
                                }}
                            >
                                <ListIcon className="mr-1" /> Text Poll
                            </Button>
                            <Button
                                variant={
                                    postType === "quiz" ? "secondary" : "ghost"
                                }
                                className="rounded-full"
                                onClick={() => {
                                    setPostType("quiz");
                                    setData({
                                        text: "",
                                        options: ["", ""],
                                        correct: -1,
                                        explanation: "",
                                    });
                                }}
                            >
                                <SquareCheckBigIcon className="mr-1" />
                                Quiz
                            </Button>
                            <Button
                                variant={
                                    postType === "video" ? "secondary" : "ghost"
                                }
                                className="rounded-full"
                                onClick={() => {
                                    setPostType("video");
                                    setData({ text: "", video: "" });
                                }}
                            >
                                <FilmIcon className="mr-1" />
                                Video
                            </Button>
                        </div>
                        <div className="flex items-center justify-end md:justify-normal space-x-2">
                            <Button
                                variant={
                                    postType !== "text" ? "secondary" : "ghost"
                                }
                                className="rounded-full"
                                onClick={reset}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-500 rounded-full text-white"
                                size="lg"
                                onClick={handleSubmit}
                                disabled={isPostDisabled() || isUploading}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    "Post"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
