import { IPostData } from "@/interfaces";
import { AvatarImg } from "../avatar-image";
import {
    EllipsisVerticalIcon,
    MessageSquareMoreIcon,
    Share2Icon,
    ThumbsUpIcon,
    ThumbsDownIcon
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const PostCard = ({ post }: { post: IPostData }) => {
    const { avatar, fullname, username } = post.creator || {};

    const isTextPoll = post.options && post.options.length > 0 && typeof post.options[0] === 'string';
    const isImagePoll = post.options && post.options.length > 0 && typeof post.options[0] === 'object';
    const isQuiz = isTextPoll && typeof post.correct !== 'undefined';

    return (
        <div className="max-w-[800px] w-full border border-gray-200 dark:border-[#272727] rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#0F0F0F] my-4 shadow-sm hover:shadow-md transition-shadow">
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
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <Link to={`/channel/${username}`}>
                                <span className="font-bold text-sm sm:text-base hover:text-black dark:hover:text-white text-gray-900 dark:text-gray-100 cursor-pointer">
                                    {fullname}
                                </span>
                            </Link>
                            <span className="text-xs sm:text-sm text-muted-foreground">•</span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                {formatDistanceToNowStrict(new Date(post.updatedAt)).replace("about ", "") + " ago"}
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            @{username}
                        </span>
                    </div>
                </div>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#272727]">
                    <EllipsisVerticalIcon className="size-5" />
                </Button>
            </div>

            {/* Body Text */}
            <div className="mt-3 sm:mt-4 text-[15px] sm:text-base whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed font-normal">
                {post.text}
            </div>

            {/* Render Image Post */}
            {post.images && post.images.length > 0 && !isImagePoll && (
                <div className="mt-3 sm:mt-4">
                    <img 
                        src={Array.isArray(post.images) ? post.images[0] : post.images} 
                        alt="Post attachment" 
                        className="w-full rounded-xl sm:rounded-2xl object-cover max-h-[500px] border border-gray-100 dark:border-[#272727]" 
                    />
                </div>
            )}

            {/* Render Text Poll or Quiz */}
            {(isTextPoll || isQuiz) && (
                <div className="mt-4 flex flex-col space-y-2">
                    {post.options!.map((opt: any, index: number) => (
                        <div 
                            key={index} 
                            className="w-full relative border border-gray-300 dark:border-[#3f3f3f] rounded-md p-3 text-sm sm:text-base cursor-pointer hover:bg-gray-100 dark:hover:bg-[#272727] transition-colors overflow-hidden"
                        >
                            <span className="relative z-10 font-medium">{opt}</span>
                        </div>
                    ))}
                    <div className="text-xs text-muted-foreground mt-2 ml-1">
                        {isQuiz ? "Quiz • Select the correct answer" : "Poll"}
                    </div>
                </div>
            )}

            {/* Render Image Poll */}
            {isImagePoll && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {post.options!.map((opt: any, index: number) => (
                        <div 
                            key={index} 
                            className="flex flex-col border border-gray-200 dark:border-[#3f3f3f] rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow group relative"
                        >
                            <div className="w-full aspect-square overflow-hidden bg-muted">
                                <img 
                                    src={opt.image} 
                                    alt={`Poll option ${index + 1}`} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="p-3 text-sm font-medium text-center bg-gray-50 dark:bg-[#1f1f1f]">
                                {opt.text}
                            </div>
                        </div>
                    ))}
                    <div className="col-span-2 sm:col-span-3 text-xs text-muted-foreground ml-1 mt-1">
                        Image Poll
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-4 mt-3 sm:mt-4">
                <div className="flex items-center rounded-full bg-gray-100 dark:bg-[#272727]">
                    <Button variant="ghost" className="rounded-l-full px-3 sm:px-4 h-9 hover:bg-gray-200 dark:hover:bg-[#3f3f3f]">
                        <ThumbsUpIcon className="size-4 sm:size-5 sm:mr-2" />
                        <span className="text-xs sm:text-sm font-medium hidden sm:block">Like</span>
                    </Button>
                    <div className="w-[1px] h-5 bg-gray-300 dark:bg-gray-600"></div>
                    <Button variant="ghost" className="rounded-r-full px-3 sm:px-4 h-9 hover:bg-gray-200 dark:hover:bg-[#3f3f3f]">
                        <ThumbsDownIcon className="size-4 sm:size-5" />
                    </Button>
                </div>

                <Button variant="ghost" className="rounded-full px-3 sm:px-4 h-9 bg-gray-100 dark:bg-[#272727] hover:bg-gray-200 dark:hover:bg-[#3f3f3f]">
                    <MessageSquareMoreIcon className="size-4 sm:size-5 sm:mr-2" />
                    <span className="text-xs sm:text-sm font-medium hidden sm:block">Comment</span>
                </Button>

                <Button variant="ghost" className="rounded-full px-3 sm:px-4 h-9 bg-gray-100 dark:bg-[#272727] hover:bg-gray-200 dark:hover:bg-[#3f3f3f]">
                    <Share2Icon className="size-4 sm:size-5 sm:mr-2" />
                    <span className="text-xs sm:text-sm font-medium hidden sm:block">Share</span>
                </Button>
            </div>
        </div>
    );
};
