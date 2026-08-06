import { IPostData } from "@/interfaces";
import { AvatarImg } from "../avatar-image";
import {
  EllipsisVerticalIcon,
  MessageSquareMoreIcon,
  Share2Icon,
  ThumbsUpIcon,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { likeService } from "@/services/like";
import { commentService } from "@/services/comment";
import { useDispatch, useSelector } from "react-redux";
import { setShareModalData } from "@/store/reducers/ui";
import { RootState } from "@/store/store";
import { videoService } from "@/services/video";
import { Loader2, Play } from "lucide-react";

const SharedVideoEmbed = ({ videoData }: { videoData: string | any }) => {
  const videoId = typeof videoData === "string" ? videoData : videoData?._id;

  const { data: video, isLoading } = useQuery({
    queryKey: ["sharedVideo", videoId],
    queryFn: async () => {
      const data = await videoService.singleVideo(videoId);
      return data.video;
    },
    enabled: !!videoId && typeof videoData === "string",
  });

  const displayVideo = typeof videoData === "string" ? video : videoData;

  if (isLoading) {
    return (
      <div className="w-full h-[200px] mt-4 flex items-center justify-center border border-gray-200 dark:border-[#272727] rounded-xl bg-muted/20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!displayVideo) return null;

  return (
    <Link to={`/watch/${displayVideo._id}`} className="block mt-4">
      <div className="flex flex-col sm:flex-row border border-gray-200 dark:border-[#272727] rounded-xl overflow-hidden hover:bg-gray-50 dark:hover:bg-[#1f1f1f] transition-colors group">
        <div className="relative w-full sm:w-[240px] aspect-video bg-muted flex-shrink-0">
          <img src={displayVideo.thumbnail} alt={displayVideo.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/60 rounded-full p-2">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-4 flex flex-col justify-center w-full">
          <h3 className="font-semibold text-[15px] sm:text-base line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {displayVideo.title}
          </h3>
          <div className="mt-1 text-[13px] text-muted-foreground flex items-center space-x-1 font-medium">
            <span>{displayVideo.creator?.fullname || "Unknown Creator"}</span>
            <span>•</span>
            <span>{displayVideo.views || 0} views</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export const PostCard = ({ post }: { post: IPostData }) => {
  const { avatar, fullname, username } = post.creator || {};

  const isTextPoll = post.options && post.options.length > 0 && typeof post.options[0] === 'string';
  const isImagePoll = post.options && post.options.length > 0 && typeof post.options[0] === 'object';
  const isQuiz = isTextPoll && typeof post.correct !== 'undefined';

  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const theme = useSelector((state: RootState) => state.theme.mode);

  // Likes
  const { data: isLiked } = useQuery({
    queryKey: ["isLiked", post._id, "post"],
    queryFn: async () => {
      const data = await likeService.isLiked(post._id, "post");
      return data.isLiked;
    },
  });

  const { data: likesCount } = useQuery({
    queryKey: ["likesCount", post._id, "post"],
    queryFn: async () => {
      const data = await likeService.likesCount(post._id, "post");
      return data.likesCount;
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => await likeService.toggleLike(post._id, "post"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isLiked", post._id, "post"] });
      queryClient.invalidateQueries({ queryKey: ["likesCount", post._id, "post"] });
    },
  });

  // Comments count
  const { data: commentsCount } = useQuery({
    queryKey: ["commentsCount", post._id, "post"],
    queryFn: async () => {
      const data = await commentService.commentsCount(post._id, "post");
      return data.commentsCount;
    },
  });

  const handleShare = () => {
    dispatch(setShareModalData({ open: true, id: post._id, type: "post" }));
  };

  return (
    <div className="max-w-[800px] w-full border border-gray-200 dark:border-[#272727] rounded-xl p-4 sm:p-5 bg-white dark:bg-[#0F0F0F] my-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Link to={`/channel/${username}`}>
            <AvatarImg
              avatar={avatar}
              fullname={fullname}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full cursor-pointer hover:opacity-90 transition-opacity"
            />
          </Link>
          <div className="flex flex-col justify-center h-full">
            <div className="flex items-center space-x-1.5">
              <Link to={`/channel/${username}`}>
                <span className="font-bold text-[15px] hover:text-black dark:hover:text-white text-foreground cursor-pointer">
                  {fullname}
                </span>
              </Link>
              <span className="text-xs text-muted-foreground">•</span>
              <Link to={`/post/${post._id}`}>
                <span className="text-[13px] text-muted-foreground hover:underline cursor-pointer">
                  {formatDistanceToNowStrict(new Date(post.updatedAt)).replace("about ", "") + " ago"}
                </span>
              </Link>
            </div>
          </div>
        </div>
        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#272727]">
          <EllipsisVerticalIcon className="size-5" />
        </Button>
      </div>

      {/* Body Text */}
      <div className="mt-3 sm:mt-4 text-[15px] sm:text-base whitespace-pre-wrap text-foreground leading-relaxed font-normal">
        {post.text}
      </div>

      {/* Render Image Post */}
      {post.images && post.images.length > 0 && !isImagePoll && (
        <div className="mt-4 rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 dark:border-[#272727] bg-black/5 dark:bg-white/5">
          <img
            src={Array.isArray(post.images) ? post.images[0] : post.images}
            alt="Post attachment"
            className="w-full object-contain max-h-[600px]"
          />
        </div>
      )}

      {/* Render Text Poll or Quiz */}
      {(isTextPoll || isQuiz) && (
        <div className="mt-4 flex flex-col space-y-2">
          {post.options!.map((opt: any, index: number) => (
            <div
              key={index}
              className="w-full relative border border-gray-300 dark:border-[#3f3f3f] rounded-md p-3 text-sm sm:text-[15px] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#272727] transition-colors overflow-hidden flex items-center font-medium"
            >
              <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-400 dark:border-gray-500 mr-3 flex-shrink-0" />
              <span className="relative z-10 text-left">{opt}</span>
            </div>
          ))}
          <div className="text-[13px] text-muted-foreground mt-2 font-medium">
            {isQuiz ? "Quiz • Select the correct answer" : "Poll"}
          </div>
        </div>
      )}

      {/* Render Image Poll */}
      {isImagePoll && (
        <div className="mt-4 grid grid-cols-2 gap-3 max-w-[500px]">
          {post.options!.map((opt: any, index: number) => (
            <div
              key={index}
              className="flex flex-col border border-gray-200 dark:border-[#3f3f3f] rounded-xl overflow-hidden cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1f1f1f] transition-colors group"
            >
              <div className="w-full aspect-square overflow-hidden bg-muted relative border-b border-gray-200 dark:border-[#3f3f3f]">
                <img
                  src={opt.image}
                  alt={`Poll option ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 text-[14px] font-medium flex items-center text-left">
                <div className="w-[16px] h-[16px] rounded-full border-2 border-gray-400 dark:border-gray-500 mr-2 flex-shrink-0" />
                <span className="truncate">{opt.text}</span>
              </div>
            </div>
          ))}
          <div className="col-span-2 text-[13px] text-muted-foreground mt-1 font-medium">
            Image Poll
          </div>
        </div>
      )}

      {/* Render Shared Video */}
      {post.video && (
        <SharedVideoEmbed videoData={post.video} />
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-4 mt-4 -ml-2">
        <Button
          variant="ghost"
          className="rounded-full px-3 h-10 text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#272727]"
          onClick={(e) => {
            e.preventDefault();
            toggleLikeMutation.mutate();
          }}
        >
          <ThumbsUpIcon className="size-5 mr-2" fill={isLiked ? (theme === "dark" ? "white" : "black") : "transparent"} strokeWidth={1.5} />
          <span className="text-[14px] font-medium">{likesCount > 0 ? likesCount : ''}</span>
        </Button>

        <Link to={`/post/${post._id}`}>
          <Button
            variant="ghost"
            className="rounded-full px-3 h-10 text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#272727]"
          >
            <MessageSquareMoreIcon className="size-5 mr-2" strokeWidth={1.5} />
            <span className="text-[14px] font-medium">{commentsCount > 0 ? commentsCount : ''}</span>
          </Button>
        </Link>

        <Button
          variant="ghost"
          className="rounded-full px-3 h-10 text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#272727]"
          onClick={(e) => {
            e.preventDefault();
            handleShare();
          }}
        >
          <Share2Icon className="size-5" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
};
