import { asyncHandler } from "../utils/handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { Comment } from "../models/comment.js";
import { Video } from "../models/video.js";
import { publishNotification } from "../lib/kafka/producer.js";
import { Short } from "../models/short.js";
import { Post } from "../models/post.js";
import { Types } from "mongoose"
const ObjectId = Types.ObjectId;
class CommentController {
  getAllVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10, sentiment = 'All' } = req.query;
    if (!videoId) {
      throw new ApiError(400, "Video ID is required")
    }
    const aggregate = Comment.aggregate([
      {
        $match: {
          videoId: new ObjectId(videoId),
          sentiment: sentiment === 'All' ? { $exists: true } : sentiment
        }
      },
      {
        $lookup: {
          from: "replies",
          foreignField: "commentId",
          localField: "_id",
          as: "replies"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "creator"
        }
      },
      {
        $addFields: {
          creator: {
            $first: "$creator"
          },
          repliesCount: {
            $size: "$replies"
          }
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $project: {
          content: 1,
          sentiment: 1,
          createdAt: 1,
          creator: 1,
          repliesCount: 1
        }

      }
    ]);
    const comments = await Comment.aggregatePaginate(aggregate, { page, limit });
    return res.status(200).json(new ApiResponse(200, { comments }, "Comments fetched successfully"))
  })
  addCommentToVideo = asyncHandler(async (req, res) => {
    const { content, sentiment } = req.body;
    const { videoId } = req.params;
    const user = req.user;

    if (!content || !videoId || !sentiment) {
      throw new ApiError(400, "Content, video ID, and sentiment are required");
    }
    const comment = await Comment.create({
      content,
      videoId,
      userId: user._id,
      sentiment,
    });
    if (!comment) {
      throw new ApiError(500, "Comment could not be created");
    }
    //publishing notification
    const video = await Video.findById(videoId);
    if (!video.userId.equals(user._id)) {
      const message = `@${user.username} commented: "${content}"`;
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
          fullname: user.fullname
        },
        read: false,
        createdAt: new Date(Date.now()),
      });
    }
    //end

    return res
      .status(201)
      .json(new ApiResponse(201, { comment }, "Comment created successfully"));
  });
  getAllShortComments = asyncHandler(async (req, res) => {
    const { shortId } = req.params;
    const { page = 1, limit = 10, sentiment = 'All' } = req.query;
    if (!shortId) {
      throw new ApiError(400, "Short ID is required")
    }
    const aggregate = Comment.aggregate([
      {
        $match: {
          shortId: new ObjectId(shortId),
          sentiment: sentiment === 'All' ? { $exists: true } : sentiment
        }
      },
      {
        $lookup: {
          from: "replies",
          localField: "_id",
          foreignField: "commentId",
          as: "replies"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "creator"
        }
      },
      {
        $addFields: {
          creator: {
            $first: "$creator"
          },
          repliesCount: {
            $size: "$replies"
          }
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $project: {
          content: 1,
          sentiment: 1,
          createdAt: 1,
          creator: 1,
          repliesCount: 1
        }

      }
    ]);
    const comments = await Comment.aggregatePaginate(aggregate, {
      page,
      limit,
    });
    return res.status(200).json(new ApiResponse(200, { comments }, "Comments fetched successfully"))
  })
  addCommentToShort = asyncHandler(async (req, res) => {
    const { content, sentiment } = req.body;
    const { shortId } = req.params;
    const user = req.user;

    if (!content || !shortId || !sentiment) {
      throw new ApiError(400, "Content, shortId, and sentiment are required");
    }
    const comment = await Comment.create({
      content,
      shortId,
      userId: user._id,
      sentiment,
    });
    if (!comment) {
      throw new ApiError(500, "Comment could not be created");
    }
    //publishing notification
    const short = await Short.findById(shortId);
    if (short && !short.userId.equals(user._id)) {
      const message = `@${user.username} commented: "${content}"`;
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
          fullname: user.fullname
        },
        read: false,
        createdAt: new Date(Date.now()),
      });
    }
    //end

    return res
      .status(201)
      .json(new ApiResponse(201, { comment }, "Comment created successfully"));
  });

  getAllPostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 10, sentiment = 'All' } = req.query;
    if (!postId) {
      throw new ApiError(400, "Post ID is required")
    }
    const aggregate = Comment.aggregate([
      {
        $match: {
          postId: new ObjectId(postId),
          sentiment: sentiment === 'All' ? { $exists: true } : sentiment
        }
      },
      {
        $lookup: {
          from: "replies",
          localField: "_id",
          foreignField: "commentId",
          as: "replies"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "creator"
        }
      },
      {
        $addFields: {
          creator: {
            $first: "$creator"
          },
          repliesCount: {
            $size: "$replies"
          }
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $project: {
          content: 1,
          sentiment: 1,
          createdAt: 1,
          creator: {
            username: 1,
            fullname: 1,
            avatar: 1
          },
          repliesCount: 1,
        }
      }
    ])
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
    const comments = await Comment.aggregatePaginate(aggregate, options).catch((error) => {
      throw new ApiError(500, error?.message || "Failed to fetch comments")
    });
    return res.status(200).json(new ApiResponse(200, { comments }, "Comments fetched successfully"))
  })

  addCommentToPost = asyncHandler(async (req, res) => {
    const { content, sentiment } = req.body;
    const { postId } = req.params;
    const user = req.user;

    if (!content || !postId || !sentiment) {
      throw new ApiError(400, "Content, postId, and sentiment are required");
    }
    const comment = await Comment.create({
      content,
      postId,
      userId: user._id,
      sentiment,
    });
    if (!comment) {
      throw new ApiError(500, "Comment could not be created");
    }
    //publishing notification
    const post = await Post.findById(postId);
    if (post && !post.userId.equals(user._id)) {
      const message = `@${user.username} commented: "${content}"`;
      publishNotification({
        userId: post.userId,
        message,
        creator: {
          _id: user._id,
          avatar: user.avatar,
          fullname: user.fullname
        },
        read: false,
        createdAt: new Date(Date.now()),
      });
    }
    //end

    return res
      .status(201)
      .json(new ApiResponse(201, { comment }, "Comment created successfully"));
  });
  commentsCount = asyncHandler(async (req, res) => {
    const { videoId, shortId, postId } = req.query;
    if (!videoId && !shortId && !postId) {
      throw new ApiError(400, "video id, short id, or post id is required")
    }
    let commentsCount = 0;
    if (videoId) {
      commentsCount = await Comment.countDocuments({ videoId: new ObjectId(videoId) })
    } else if (shortId) {
      commentsCount = await Comment.countDocuments({ shortId: new ObjectId(shortId) })
    } else if (postId) {
      commentsCount = await Comment.countDocuments({ postId: new ObjectId(postId) })
    }
    return res.status(200).json(new ApiResponse(200, { commentsCount }, "comments count fetched successfully"))
  })
  deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?._id;
    if (!commentId) {
      throw new ApiError(400, "Comment ID is required")
    }
    const deletedComment = await Comment.findOneAndDelete({ _id: new ObjectId(commentId), userId });
    if (!deletedComment) {
      throw new ApiError(404, "Comment not found or you are not authorized to delete it")
    }
    return res.status(200).json(new ApiResponse(200, { commentId: deletedComment._id }, "Comment deleted successfully"))
  })
  updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { commentId } = req.params;
    const userId = req.user?._id;
    if (!commentId || !content) {
      throw new ApiError(400, "comment ID and content are required")
    }
    const comment = await Comment.findOne({ _id: new ObjectId(commentId), userId });
    if (!comment) {
      throw new ApiError(404, "Comment not found or you are not authorized to update it")
    }

    comment.content = content;
    const updatedComment = await comment.save({ validateBeforeSave: true });
    if (!updatedComment) {
      throw new ApiError(500, "comment could not be updated")
    }
    return res.status(200).json(new ApiResponse(200, { commentId: updatedComment._id }, "Comment updated successfully"))
  })
}

export const commentController = new CommentController();