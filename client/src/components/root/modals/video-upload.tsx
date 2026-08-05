import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowUpFromLineIcon } from "lucide-react";
import { ResponsiveModal } from "./responsive-modal";
import { RootState } from "@/store/store";
import { toggleVideoModal } from "@/store/reducers/ui";
import { uploadService } from "@/services/upload";
import { getVideoMetadata } from "@/lib/utils";
import { uploadToPresignedUrl } from "@/lib/upload";
import { shortService } from "@/services/short";
import { videoService } from "@/services/video";
import { useNavigate } from "react-router-dom";

const BUCKET = process.env.OUTPUT_BUCKET;

export default function UploadVideo() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [progress, setProgress] = useState(0);
  const { limit = 100 } = useSelector((state: RootState) => state.auth.userData) || {};
  const open = useSelector((state: RootState) => state.ui.isVideoModalOpen);
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "video/*": [] },
    onDrop: (acceptedFile) => onFileChange(acceptedFile),
  });

  const onFileChange = async (file: File | File[]) => {
    setIsUploading(true);
    setProgress(0);
    try {
      let video: File = Array.isArray(file) ? file[0] : file;
      if (video.size >= limit * 1024 * 1024) {
        toast.error(`File size exceeds your limit of ${limit}MB`);
        return;
      }
      const { duration, height, width } = await getVideoMetadata(video);
      const isShort = duration <= 90 && height > width;
      const file_name = `${uuid()}_${width}_${height}`;
      const videoKey = `uploads/${isShort ? "shorts" : "videos"
        }/${file_name}.${video.name.split(".").pop()}`;
      const contentType = video.type || "application/octet-stream";
      const { url, id } = await uploadService.getPutObjectPresignedUrl(
        videoKey,
        contentType,
        isShort ? "short" : "video"
      );
      const controller = new AbortController();
      setAbortController(controller);

      await uploadToPresignedUrl(url, video, controller, (progress) =>
        setProgress(progress)
      );

      const videoData = {
        _id: id,
        title: video.name.split('.').slice(0, -1).join('.') || "Untitled",
        source: `https://${BUCKET}.s3.ap-south-1.amazonaws.com/${file_name}/${isShort ? height + "p.m3u8" : "master.m3u8"
          }`,
        duration,
        size: Math.floor(video.size / 1024 / 1024),
        subtitle: `https://${BUCKET}.s3.ap-south-1.amazonaws.com/${file_name}/subtitle.vtt`,
        thumbnailPreviews: `https://${BUCKET}.s3.ap-south-1.amazonaws.com/${file_name}/thumbnails/thumbnails.vtt`,
        height,
      };

      isShort
        ? await shortService.upload(videoData)
        : await videoService.upload(videoData);
      toast.success(`${isShort ? "Short" : "Video"} post created successfully`);
      dispatch(toggleVideoModal(false));
      navigate(`/studio/${isShort ? "short" : "video"}/${id}`);
    } catch (err) {
      console.log(err);
      if (err.name !== "CanceledError") toast.error(err.message);
    } finally {
      setIsUploading(false);
      setAbortController(null);
      setProgress(0);
    }
  };

  const handleAbort = () => {
    if (abortController) {
      abortController.abort();
      toast.warning("Upload aborted!");
    }
  };

  const closeDialog = () => {
    dispatch(toggleVideoModal(false));
  };

  return (
    <ResponsiveModal
      title="Upload video"
      open={open}
      onOpenChange={closeDialog}
      className="max-w-xl"
    >
      <div
        {...getRootProps()}
        className="flex-1 cursor-pointer items-center justify-center flex flex-col text-center space-y-4 sm:min-h-[500px] focus:outline-none"
      >
        <input {...getInputProps()} disabled className="h-full w-full" />
        <div
          className="flex items-center justify-center rounded-full mx-auto w-1/3 aspect-square dark:bg-[#1F1F1F] bg-[#F9F9F9] hover:opacity-80"
          onClick={() => inputRef.current.click()}
        >
          <ArrowUpFromLineIcon
            size={60}
            strokeWidth={3.0}
            className="text-[#909090]"
          />
        </div>
        <div>
          <p>Drag and drop video file to upload</p>
          <p className="text-sm text-muted-foreground">
            Your videos will be private until you publish them.
          </p>
        </div>
        {isUploading ? (
          <div className="w-full text-center space-y-2 flex flex-col items-center">
            {`${progress}%`}
            <Progress value={progress} className="h-1 w-3/4" />
            <Button
              onClick={handleAbort}
              variant="destructive"
              className="rounded-full"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button className="rounded-full relative" size="lg">
            <div>Select file</div>
            <Input
              ref={inputRef}
              type="file"
              accept="video/*"
              onChange={(e) => onFileChange(e.target.files?.[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-md mt-4">
        By submitting your videos to TubeX, you acknowledge that you agree to
        TubeX's <span className="text-blue-400">Terms of Service</span> and
        <span className="text-blue-400"> Community Guidelines</span>. Please
        ensure you do not violate others' copyright or privacy rights.
      </p>
    </ResponsiveModal>
  );
}
