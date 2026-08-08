import { asyncHandler } from "../utils/handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import mongoose from "mongoose";
import { Post } from "../models/post.js";
import { Subscription } from "../models/subscription.js";
import { publishNotification } from "../lib/kafka/producer.js";
import { User } from "../models/user.js";
import { ImagePost } from "../models/image-post.js";
import { VideoPost } from "../models/video-post.js";
import { ShortPost } from "../models/short-post.js";
import { TextPost } from "../models/text-post.js";
import { QuizPost } from "../models/quiz-post.js";
import { ImagePollPost } from "../models/image-poll-post.js";
import { TextPollPost } from "../models/text-poll-post.js";
const postModels = {
  image: ImagePost,
  video: VideoPost,
  short: ShortPost,
  text: TextPost,
  quiz: QuizPost,
  "image-poll": ImagePollPost,
  "text-poll": TextPollPost,
};
class PostController {
  createPost = asyncHandler(async (req, res) => {
    const { type, ...data } = req.body;
    const user = req.user;
    let post;
    switch (type) {
      case "text":
        post = await TextPost.create({ userId: user._id, ...data });
        break;
      case "quiz":
        post = await QuizPost.create({ userId: user._id, ...data });
        break;
      case "text-poll":
        post = await TextPollPost.create({ userId: user._id, ...data });
        break;
      case "image-poll":
        post = await ImagePollPost.create({ userId: user._id, ...data });
        break;
      case "video":
        post = await VideoPost.create({ userId: user._id, ...data });
        break;
      case "short":
        post = await ShortPost.create({ userId: user._id, ...data });
        break;
      case "image":
        post = await ImagePost.create({ userId: user._id, ...data });
        break;
      default:
        throw new ApiError(400, "Invalid post type")
    }

    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channelId: user._id
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriberId",
          foreignField: "_id",
          as: "subscriber"
        }
      },
      {
        $addFields: {
          subscriberId: {
            $first: "$subscriber._id"
          }
        }
      },
      {
        $project: {
          subscriberId: 1,
        }
      }
    ]);
    const message = `@${user.username} posted: "${post.content}"`;
    const image = post.type === "image" ? post.images[0] : post.type === "image-poll" ? post.images[0] : null;

    subscribers.forEach((s) => {
      publishNotification({
        userId: s.subscriberId,
        message,
        post: {
          _id: post._id,
          image
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
    })
    //end
    return res.status(201).json(new ApiResponse(201, post, "Post created successfully"))

  })
  updatePost = asyncHandler(async (req, res) => {
    const { postId, type } = req.params;
    const updateData = req.body;

    if (!postModels[type]) {
      throw new ApiError(400, "Invalid post type")
    }

    const updatedPost = await postModels[type].findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(postId), userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPost) {
      throw new ApiError(404, "Post not found")
    }

    return res.status(200).json(new ApiResponse(200, updatedPost, "Post updated successfully"))
  })
  deletePost = asyncHandler(async (req, res) => {
    const { postId, type } = req.params;
    if (!postId || !type) {
      throw new ApiError(400, "Post id and type are required")
    }
    if (!postModels[type]) {
      throw new ApiError(400, "Invalid post type")
    }
    const deletedPost = await postModels[type].findOneAndDelete({
      _id: new mongoose.Types.ObjectId(postId),
      userId: req.user._id
    });

    if (!deletedPost) {
      throw new ApiError(404, "Post not found")
    }
    return res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"))
  })
  getUserPosts = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) {
      throw new ApiError(400, "Username is required")
    }
    const user = await User.findOne({ username });
    if (!user) {
      throw new ApiError(404, "User not found")
    }
    const isOwner = req.user?._id?.toString() === user._id.toString();
    const visibilityMatch = isOwner 
      ? { $in: ["public", "private", "unlisted"] } 
      : "public";

    const posts = await Post.aggregate([
      {
        $match: {
          userId: user._id,
          visibility: visibilityMatch
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      }
    ])
    return res.status(200).json(new ApiResponse(200, { posts }, "Posts fetched successfully"))
  })

  getPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    if (!postId) {
      throw new ApiError(400, "Post id is required");
    }

    const post = await Post.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(postId)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "creator",
          pipeline: [
            {
              $project: {
                username: 1,
                fullname: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          creator: { $first: "$creator" }
        }
      }
    ]);

    if (!post || post.length === 0) {
      throw new ApiError(404, "Post not found");
    }
    const postData = post[0];
    if (postData.visibility === "private" && postData.creator._id.toString() !== req.user?._id?.toString()) {
      throw new ApiError(403, "This post is private");
    }

    return res.status(200).json(new ApiResponse(200, { post: postData }, "Post fetched successfully"));
  })
}

export const postController = new PostController();