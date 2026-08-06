import { asyncHandler } from "../utils/handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { Like } from "../models/like.js";
import { Comment } from "../models/comment.js";
import { Reply } from "../models/reply.js";
import { Video } from "../models/video.js";
import { Post } from "../models/post.js"
import { publishNotification } from "../lib/kafka/producer.js";
import { Short } from "../models/short.js";
import { Types } from "mongoose"
const ObjectId = Types.ObjectId;
class LikeController {
  toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const user = req.user;
    if (!commentId) {
      throw new ApiError(400, "Comment id is required")
    }
    const dbLike = await Like.findOne({ commentId: new ObjectId(commentId), userId: user._id })
    if (!dbLike) {
      const like = await Like.create({
        commentId,
        userId: user._id
      })
      // publishing notification
      const comment = await Comment.findById(new ObjectId(commentId));
      if (like && comment && !comment.userId.equals(user._id)) {
        const video = await Video.findById(comment.videoId) || await Short.findById(comment.shortId);
        if (video) {
          const message = `@${user.username} liked your comment: "${comment.content}"`;
          publishNotification({
            userId: comment.userId,
            message,
            video: {
              _id: video._id,
              thumbnail: video.thumbnail,
            },
            creator: {
              _id: user._id,
              avatar: user.avatar,
              fullname: user.fullname,
              username: user.username
            },
            read: false,
            createdAt: new Date(Date.now()),
          });
        }
      }
      //end
    }
    else {
      await Like.findByIdAndDelete(dbLike._id)
    }

    return res.status(200).json(new ApiResponse(200, null, `${dbLike ? "unliked" : "liked"} comment`))
  })
  toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const user = req.user;
    if (!videoId) throw new ApiError(400, "Video id is required");
    const dbLike = await Like.findOne({ videoId: new ObjectId(videoId), userId: user._id });
    if (!dbLike) {
      const like = await Like.create({
        videoId,
        userId: user._id
      })
      // publishing notification
      const video = await Video.findById(videoId)
      if (like && video && !video.userId.equals(user._id)) {
        const message = `@${user.username} liked your video: "${video.title}"`;
        publishNotification({
          userId: video.userId,
          message,
          video: {
            _id: video._id,
            thumbnail: video.thumbnail,
          },
          creator: {
            _id: user._id,
            avatar: user.avatar,
            fullname: user.fullname,
            username: user.username
          },
          read: false,
          createdAt: new Date(Date.now()),
        });
      }
      //end
    }
    else {
      await Like.findByIdAndDelete(dbLike._id)
    }
    return res.status(200).json(new ApiResponse(200, null, `${dbLike ? "unliked" : "liked"} video`));
  })
  toggleShortLike = asyncHandler(async (req, res) => {
    const { shortId } = req.params;
    const user = req.user;
    if (!shortId) throw new ApiError(400, "short id is required");
    const dbLike = await Like.findOne({ shortId: new ObjectId(shortId), userId: user._id });
    if (!dbLike) {
      const like = await Like.create({
        shortId,
        userId: user._id
      })
      // publishing notification
      const short = await Short.findById(shortId)
      if (like && short && !short.userId.equals(user._id)) {
        const message = `@${user.username} liked your short: "${short.title}"`;
        publishNotification({
          userId: short.userId,
          message,
          short: {
            _id: short._id,
            thumbnail: short.thumbnail,
          },
          creator: {
            _id: user._id,
            avatar: user.avatar,
            fullname: user.fullname,
            username: user.username
          },
          read: false,
          createdAt: new Date(Date.now()),
        });
      }
      //end
    }
    else {
      await Like.findByIdAndDelete(dbLike._id)
    }
    return res.status(200).json(new ApiResponse(200, null, `${dbLike ? "unliked" : "liked"} short`));
  })
  togglePostLike = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const user = req.user;
    if (!postId) throw new ApiError(400, "Post id is required");
    const dbLike = await Like.findOne({ postId: new ObjectId(postId), userId: user._id })
    if (!dbLike) {
      const like = await Like.create({
        userId: user._id,
        postId,
      })
      // publishing notification
      const post = await Post.findById(postId)
      if (like && post && !post.userId.equals(user._id)) {
        const message = `@${user.username} liked your post: "${post.content}"`;
        publishNotification({
          userId: post.userId,
          message,
          post: {
            _id: post._id,
            image: post.image,
          },
          creator: {
            _id: user._id,
            avatar: user.avatar,
            fullname: user.fullname,
            username: user.username
          },
          read: false,
          createdAt: new Date(Date.now()),
        });
      }
      //end
    } else {
      await Like.findByIdAndDelete(dbLike._id)
    }
    return res.status(200).json(new ApiResponse(200, null, `${dbLike ? "unliked" : "liked"} post`))
  })
  toggleReplyLike = asyncHandler(async (req, res) => {
    const { replyId } = req.params;
    const user = req.user;
    if (!replyId) throw new ApiError(400, "Reply id is required");
    const dbLike = await Like.findOne({ replyId: new ObjectId(replyId), userId: user._id });
    if (!dbLike) {
      const like = await Like.create({
        userId: user._id,
        replyId,
      })
      // publishing notification
      const reply = await Reply.findById(replyId)
      if (like && reply) {
        const comment = await Comment.findById(reply.commentId)
        if (comment) {
          const video = await Video.findById(comment.videoId)
          if (video && !reply.userId.equals(user._id)) {
            const message = `@${user.username} liked your reply: "${reply.content}"`;
            publishNotification({
              userId: reply.userId,
              message,
              video: {
                _id: video._id,
                thumbnail: video.thumbnail,
              },
              creator: {
                _id: user._id,
                avatar: user.avatar,
                fullname: user.fullname,
                username: user.username
              },
              read: false,
              createdAt: new Date(Date.now()),
            });
          }
        }
      }
      //end
    } else {
      await Like.findByIdAndDelete(dbLike._id)
    }
    return res.status(200).json(new ApiResponse(200, null, `${dbLike ? "unliked" : "liked"} reply`))
  })
  likesCount = asyncHandler(async (req, res) => {
    const { videoId, shortId, postId } = req.query;
    if (!videoId && !shortId && !postId) {
      throw new ApiError(400, "video id, short id, or post id is required")
    }
    let likesCount = 0;
    if (videoId) {
      likesCount = await Like.countDocuments({ videoId })
    } else if (shortId) {
      likesCount = await Like.countDocuments({ shortId })
    } else if (postId) {
      likesCount = await Like.countDocuments({ postId })
    }
    return res.status(200).json(new ApiResponse(200, { likesCount }, "likes fetched successfully"))
  })
  isLiked = asyncHandler(async (req, res) => {
    const { videoId, shortId, postId } = req.query;
    const userId = req.user?._id;
    if (!videoId && !shortId && !postId) throw new ApiError(400, "video id, short id, or post id is required");
    let isLiked = false;
    if (videoId) {
      isLiked = await Like.findOne({ videoId: new ObjectId(videoId), userId });
    } else if (shortId) {
      isLiked = await Like.findOne({ shortId: new ObjectId(shortId), userId });
    } else if (postId) {
      isLiked = await Like.findOne({ postId: new ObjectId(postId), userId });
    }
    return res.status(200).json(new ApiResponse(200, { isLiked: !!isLiked }, "is liked fetched successfully"));
  })
  videoCommentsLikeCount = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) throw new ApiError(400, "Video id is required");
    const comments = await Comment.find({
      videoId: new ObjectId(videoId),
    })
    let likesCount = [];
    for (let comment of comments) { likesCount.push(await Like.countDocuments({ commentId: comment._id })) }
    return res.status(200).json(new ApiResponse(200, { likesCount }, "video comments like count fetched successfully"))
  })
  shortCommentsLikeCount = asyncHandler(async (req, res) => {
    const { shortId } = req.params;
    if (!shortId) throw new ApiError(400, "short id is required");
    const comments = await Comment.find({
      shortId: new ObjectId(shortId),
    })
    let likesCount = [];
    for (let comment of comments) { likesCount.push(await Like.countDocuments({ commentId: comment._id })) }
    return res.status(200).json(new ApiResponse(200, { likesCount }, "short comments like count fetched successfully"))
  })
  postCommentsLikeCount = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    if (!postId) throw new ApiError(400, "post id is required");
    const comments = await Comment.find({
      postId: new ObjectId(postId),
    })
    let likesCount = [];
    for (let comment of comments) { likesCount.push(await Like.countDocuments({ commentId: comment._id })) }
    return res.status(200).json(new ApiResponse(200, { likesCount }, "post comments like count fetched successfully"))
  })
  commentRepliesLikeCount = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!commentId) throw new ApiError(400, "Comment id is required");
    const replies = await Reply.find({
      commentId: new ObjectId(commentId)
    })
    let likesCount = [];
    for (let reply of replies) { likesCount.push(await Like.countDocuments({ replyId: reply._id })) }
    return res.status(200).json(new ApiResponse(200, { likesCount }, "comment replies like count fetched successfully"))
  })
  likedStatusofVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;
    if (!videoId) throw new ApiError(400, "Video id is required");
    const comments = await Comment.find({
      videoId: new ObjectId(videoId)
    })
    let likedStatus = [];
    for (let comment of comments) {
      likedStatus.push(await Like.findOne({ commentId: comment._id, userId } ?? false))
    }
    return res.status(200).json(new ApiResponse(200, { likedStatus }, "liked status of video comments fetched successfully"))
  })
  likedStatusofShortComments = asyncHandler(async (req, res) => {
    const { shortId } = req.params;
    const userId = req.user?._id;
    if (!shortId) throw new ApiError(400, "short id is required");
    const comments = await Comment.find({
      shortId: new ObjectId(shortId)
    })
    let likedStatus = [];
    for (let comment of comments) {
      likedStatus.push(await Like.findOne({ commentId: comment._id, userId }) ?? false)
    }
    return res.status(200).json(new ApiResponse(200, { likedStatus }, "liked status of short comments fetched successfully"))
  })
  likedStatusofPostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?._id;
    if (!postId) throw new ApiError(400, "post id is required");
    const comments = await Comment.find({
      postId: new ObjectId(postId)
    })
    let likedStatus = [];
    for (let comment of comments) {
      likedStatus.push(await Like.findOne({ commentId: comment._id, userId }) ?? false)
    }
    return res.status(200).json(new ApiResponse(200, { likedStatus }, "liked status of post comments fetched successfully"))
  })
  likedStatusofCommentReplies = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?._id;
    if (!commentId) throw new ApiError(400, "Video id is required");
    const replies = await Reply.find({
      commentId: new ObjectId(commentId)
    })
    let likedStatus = [];
    for (let reply of replies) {
      likedStatus.push(await Like.findOne({ replyId: reply._id, userId }) ?? false)
    }
    return res.status(200).json(new ApiResponse(200, { likedStatus }, "liked status of comment replies fetched successfully"))
  })
}

export const likeController = new LikeController();
