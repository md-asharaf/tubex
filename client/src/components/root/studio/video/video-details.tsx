import z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { videoUpdateFormValidation } from "@/validations";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { videoService } from "@/services/video";
import { IVideoData, Playlist } from "@/interfaces";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { categories } from "@/constants";
import {
  CopyCheckIcon,
  CopyIcon,
  EarthIcon,
  ImageIcon,
  LockIcon,
  MoreVerticalIcon,
  Trash2Icon,
  Undo2Icon,
  PlusIcon,
  XIcon,
  Sparkles,
  Loader2,
} from "lucide-react";
import { PlyrPlayer } from "@/components/root/video-player";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { playlistService } from "@/services/playlist";
import { useRef, useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { uploadService } from "@/services/upload";
import { v4 as uuid } from "uuid";
import { uploadToPresignedUrl } from "@/lib/upload";
import { toast } from "sonner";
import { setCreatePlaylistDialog } from "@/store/reducers/ui";
import { studioService } from "@/services/studio";
export const VideoDetails = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const { id } = useParams();
  const { username } = useSelector((state: RootState) => state.auth.userData);
  const inputRef = useRef(null);
  const playerRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isThumbnailUploaded, setIsThumbnailUploaded] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const BUCKET = process.env.INPUT_BUCKET;
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const {
    data: video,
    isLoading: isVideoLoading,
    refetch: refetchVideo,
  } = useQuery({
    queryKey: ["video", id],
    queryFn: async (): Promise<IVideoData> => {
      const data = await videoService.singleVideo(id);
      return data.video;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (video?.thumbnail) {
      setIsThumbnailUploaded(true);
    }
  }, [video?.thumbnail]);

  const videoLink = `${window.location.origin}/video/${video?._id}`;
  const {
    data: playlists,
    isLoading: isPlaylistsLoading,
    refetch: refetchPlaylists,
  } = useQuery({
    queryKey: ["playlists", username],
    queryFn: async (): Promise<Playlist[]> => {
      const data = await playlistService.getAllPlaylists(username);
      return data.playlists;
    },
    enabled: !!username,
  });
  const form = useForm<z.infer<typeof videoUpdateFormValidation>>({
    resolver: zodResolver(videoUpdateFormValidation),
    defaultValues: {
      title: video.title || "",
      description: video.description || "",
      categories: video.categories || [],
      playlists:
        playlists
          ?.filter((p) => p.shorts.includes(video._id))
          .map((p) => p._id) || [],
      visibility: video.visibility || "public",
      sourceStatus: (video.sourceStatus as "FAILED" | "PROCESSING" | "READY") || "PROCESSING",
      subtitleStatus: (video.subtitleStatus as "FAILED" | "PROCESSING" | "READY") || "PROCESSING",
      thumbnail: "",
    },
  });
  const onCopy = () => {
    navigator.clipboard.writeText(videoLink);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  const onThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const thumbnail = e.target.files?.[0];
      const thumbnailExtension = thumbnail?.name.split(".").pop();
      const thumbnailKey = `uploads/thumbnails/${uuid()}.${thumbnailExtension}`;
      const { url } = await uploadService.getPutObjectPresignedUrl(
        thumbnailKey,
        thumbnail?.type
      );
      await uploadToPresignedUrl(url, thumbnail, null, (progress) => {
        setUploadProgress(progress);
      });
      form.setValue(
        "thumbnail",
        `https://${BUCKET}.s3.ap-south-1.amazonaws.com/${thumbnailKey}`
      );
      setIsThumbnailUploaded(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };
  const onSubmit = async (data: z.infer<typeof videoUpdateFormValidation>) => {
    try {
      await videoService.updateVideo(video._id, {
        ...data,
        thumbnail: data.thumbnail || video.thumbnail,
      });
      toast.success("Changes saved");
      refetchVideo();
      refetchPlaylists();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleGenerateMetadata = async () => {
    if (!video?._id) return;
    try {
      setIsGeneratingMetadata(true);

      const response = await fetch(`${process.env.BACKEND_BASE_URL}/studio/generate-ai-metadata/${video._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate AI metadata");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              accumulatedText += data.chunk;

              let currentTitle = form.getValues("title") || "";
              let currentDesc = form.getValues("description") || "";

              if (accumulatedText.includes("TITLE:")) {
                const titleMatch = accumulatedText.match(/TITLE:\s*(.*?)(?=\nDESCRIPTION:|$)/s);
                if (titleMatch) currentTitle = titleMatch[1].trim();
              }
              if (accumulatedText.includes("DESCRIPTION:")) {
                const descMatch = accumulatedText.match(/DESCRIPTION:\s*(.*)/s);
                if (descMatch) currentDesc = descMatch[1].trim();
              }

              form.setValue("title", currentTitle, { shouldDirty: true });
              form.setValue("description", currentDesc, { shouldDirty: true });
            } catch (e) { }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate AI metadata");
    } finally {
      setIsGeneratingMetadata(false);
    }
  };
  if (isVideoLoading || isPlaylistsLoading || !video || !playlists) return null;
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 px-6 py-4 max-w-[1300px]">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold">Video Details</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                disabled={!form.formState.isDirty}
                className="font-semibold text-muted-foreground hover:bg-transparent"
                onClick={() => form.reset()}
              >
                Undo changes
              </Button>
              <Button
                disabled={!form.formState.isDirty || form.formState.isSubmitting}
                className="rounded-sm bg-[#3ea6ff] hover:bg-[#3ea6ff]/90 text-black font-semibold h-9 px-4"
                type="submit"
              >
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <MoreVerticalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="m-0 p-0" collisionPadding={10}>
                  <DropdownMenuItem className="p-2">
                    <Trash2Icon /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="grid-cols-1 lg:grid-cols-5 gap-4 grid">
            <div className="lg:col-span-3 space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="relative border border-zinc-300 dark:border-[#3f3f3f] rounded-sm p-2 focus-within:border-[#3ea6ff] focus-within:ring-1 focus-within:ring-[#3ea6ff] transition-all bg-transparent">
                    <div className="flex justify-between items-center mb-1">
                      <FormLabel className="text-xs text-muted-foreground px-1 font-normal">
                        Title (required)
                      </FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateMetadata}
                        disabled={isGeneratingMetadata || video.subtitleStatus !== "READY"}
                        className="h-6 text-xs flex items-center gap-1 hover:bg-transparent px-1"
                      >
                        {isGeneratingMetadata ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-[#3ea6ff]" />}
                        <span className="text-[#3ea6ff]">Generate with AI</span>
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        maxLength={100}
                        className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-1 text-base bg-transparent shadow-none min-h-[40px]"
                        placeholder="Add a title that describes your video"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="relative border border-zinc-300 dark:border-[#3f3f3f] rounded-sm p-2 focus-within:border-[#3ea6ff] focus-within:ring-1 focus-within:ring-[#3ea6ff] transition-all bg-transparent">
                    <FormLabel className="text-xs text-muted-foreground px-1 font-normal mb-1 block">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        maxLength={5000}
                        className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-1 text-base bg-transparent shadow-none min-h-[160px]"
                        placeholder="Tell viewers about your video"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="thumbnail"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      Thumbnail
                      <p className="text-xs text-muted-foreground">
                        Set a thumbnail that stands out and draws viewers'
                        attention.
                      </p>
                    </FormLabel>

                    <div className="flex items-center gap-4">
                      <div
                        className={`relative flex flex-col items-center justify-center border-2 rounded border-dotted ${isUploading && "animate-pulse"
                          } h-20 aspect-video`}
                      >
                        <Input
                          ref={inputRef}
                          type="file"
                          accept="image/*"
                          onChange={onThumbnailChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {isUploading ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs">{`${uploadProgress}%`}</span>
                            <span className="text-xs">Uploading</span>
                          </div>
                        ) : isThumbnailUploaded ? (
                          <div className="relative w-full h-full">
                            <img
                              src={form.getValues("thumbnail")}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-0 right-0 z-40">
                              <DropdownMenu>
                                <DropdownMenuTrigger className="focus:outline-none">
                                  <div className="rounded-full p-2 hover:bg-black/50">
                                    <MoreVerticalIcon
                                      className="size-4"
                                      color="white"
                                    />
                                  </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="m-0 p-0">
                                  <DropdownMenuItem
                                    className="p-2"
                                    onClick={() => inputRef.current?.click()}
                                  >
                                    <ImageIcon /> Change
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="p-2"
                                    onClick={() => {
                                      form.setValue("thumbnail", "");
                                      setIsThumbnailUploaded(false);
                                    }}
                                  >
                                    <Undo2Icon /> Undo
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6" />
                            <div className="text-sm">Upload file</div>
                          </>
                        )}
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories</FormLabel>
                    <Select>
                      <FormControl>
                        <SelectTrigger className="max-w-sm">
                          <SelectValue
                            placeholder={`${field.value.length > 0
                              ? `${field.value.length} categories`
                              : "Select"
                              }`}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => {
                          const isSelected = field.value?.includes(category);
                          return (
                            <div
                              key={category}
                              className="flex items-center gap-4 px-4 py-2 cursor-pointer"
                              onClick={() => {
                                const newSelection = isSelected
                                  ? field.value.filter((c) => c !== category)
                                  : [...(field.value || []), category];
                                field.onChange(newSelection);
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                className="rounded size-4"
                              />
                              <div>{category}</div>
                            </div>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="playlists"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Playlists</FormLabel>
                    <Select open={open} onOpenChange={setOpen}>
                      <FormControl>
                        <SelectTrigger className="max-w-sm">
                          <SelectValue
                            placeholder={`${field.value.length > 0
                              ? `${field.value.length} playlists`
                              : "Select"
                              }`}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {playlists.map((playlist) => {
                          const isSelected = field.value?.includes(
                            playlist._id
                          );
                          return (
                            <div
                              key={playlist._id}
                              className="flex items-center gap-4 px-4 py-2 cursor-pointer"
                              onClick={() => {
                                const newSelection = isSelected
                                  ? field.value.filter(
                                    (id) => id !== playlist._id
                                  )
                                  : [...(field.value || []), playlist._id];
                                field.onChange(newSelection);
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                className="rounded size-4"
                              />
                              <div>{playlist.name}</div>
                            </div>
                          );
                        })}
                        <Separator />
                        <div className="flex items-center justify-between p-2">
                          <Button
                            onClick={() =>
                              dispatch(setCreatePlaylistDialog(true))
                            }
                          >
                            New playlist
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                          >
                            Done
                          </Button>
                        </div>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Card className="space-y-4 pb-2 bg-[#f9f9f9] dark:bg-[#1f1f1f] shadow-none rounded-sm border-0">
                <PlyrPlayer
                  key={form.getValues("thumbnail")}
                  thumbnail={form.getValues("thumbnail") || video.thumbnail}
                  playerRef={playerRef}
                  source={video.source}
                  subtitle={video.subtitle}
                  controls={["play", "progress", "mute"]}
                  className="w-full aspect-video"
                />
                <div className="flex items-center justify-between px-4">
                  <div className="flex flex-col">
                    <div className="text-xs text-muted-foreground">
                      Video Link:
                    </div>
                    <Link
                      className="w-64 lg:w-52 xl:w-68 2xl:w-80 truncate text-blue-500 text-sm hover:cursor-pointer hover:underline"
                      to={videoLink}
                    >
                      {videoLink}
                    </Link>
                  </div>
                  <Button
                    onClick={onCopy}
                    disabled={isCopied}
                    variant="secondary"
                  >
                    {isCopied ? <CopyCheckIcon /> : <CopyIcon />}
                  </Button>
                </div>
                <FormField
                  name="sourceStatus"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col px-4 pt-4">
                      <FormLabel className="text-xs text-muted-foreground">Video Status:</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm w-[140px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                          <SelectItem value="READY">READY</SelectItem>
                          <SelectItem value="FAILED">FAILED</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  name="subtitleStatus"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col px-4 pb-4">
                      <FormLabel className="text-xs text-muted-foreground">Subtitle Status:</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm w-[140px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                          <SelectItem value="READY">READY</SelectItem>
                          <SelectItem value="FAILED">FAILED</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </Card>
              <FormField
                name="visibility"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center">
                            <EarthIcon className="size-4 mr-2" /> Public
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center">
                            <LockIcon className="size-4 mr-2" /> Private
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
