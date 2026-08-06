import { Reply } from "../models/reply.js";
import { Comment } from "../models/comment.js"
import { Video } from "../models/video.js"
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/handler.js";
import { publishNotification } from "../lib/kafka/producer.js";
import { Types } from "mongoose"
const ObjectId = Types.ObjectId;
class ReplyController {
  createReply = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const user = req.user;
    if (!commentId || !content) {
      throw new ApiError(400, "Both Comment ID and Content are required");
    }

    const reply = await Reply.create({
      content,
      userId: user._id,
      commentId
    });
    if (!reply) {
      throw new ApiError(400, "Reply could not be created")
    }
    //publishing notification
    const comment = await Comment.findById(commentId);
    if (!comment.userId.equals(user._id)) {
      const video = await Video.findById(comment.videoId)
      const message = `@${user.username} replied: "${content}"`;
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
    //end
    return res.status(201).json(new ApiResponse(201, { reply }, "Reply added successfully"));
  });

  updateReply = asyncHandler(async (req, res) => {
    const { replyId } = req.params;
    const { content } = req.body;

    if (!replyId || !content) {
      throw new ApiError(400, "Both Reply ID and Content are required");
    }

    const reply = await Reply.findByIdAndUpdate(replyId, { content }, { new: true });
    if (!reply) {
      throw new ApiError(404, "Reply not found");
    }
    return res.status(200).json(new ApiResponse(200, reply, "Reply updated successfully"));
  });

  deleteReply = asyncHandler(async (req, res) => {
    const { replyId } = req.params;

    if (!replyId) {
      throw new ApiError(400, "Reply ID is required to delete a reply");
    }

    const reply = await Reply.findByIdAndDelete(replyId);
    if (!reply) {
      throw new ApiError(404, "Reply not found");
    }
    return res.status(200).json(new ApiResponse(200, null, "Reply deleted successfully"));
  });

  getReplies = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const aggregate = Reply.aggregate([
      {
        $match: {
          commentId: new ObjectId(commentId)
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
          }
        }
      },
      {
        $project: {
          content: 1,
          sentiment: 1,
          createdAt: 1,
          creator: 1
        }
      }])
    const replies = await Reply.aggregatePaginate(aggregate, { page, limit });
    return res.status(200).json(new ApiResponse(200, { replies }, "Replies fetched successfully"));
  });
}

export const replyController = new ReplyController();
