import { asyncHandler } from "../utils/handler.js";
import { User } from "../models/user.js";
import { Video } from "../models/video.js";
import { Playlist } from "../models/playlist.js";
import { Short } from "../models/short.js";
import { Post } from "../models/post.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { generateMetadataFromSubtitleStream } from "../lib/gemini.js";
import { getObjectAsString } from "../lib/s3-client.js";
import { getCache, setCache } from "../lib/redis.js";
import { logger } from "../utils/logger.js";
class StudioController {
  getUserPosts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 5, search } = req.query;
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const matchStage = { userId: user._id };
    if (search) {
      matchStage.content = { $regex: search, $options: "i" };
    }
    const aggregate = Post.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          as: "likes"
        }
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments"
        }
      },
      {
        $addFields: {
          likes: { $size: "$likes" },
          comments: { $size: "$comments" }
        }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          type: 1,
          visibility: 1,
          createdAt: 1,
          likes: 1,
          comments: 1
        }
      }
    ]);
    const posts = await Post.aggregatePaginate(aggregate, { page, limit })

    return res.status(200).json(new ApiResponse(200, { posts }, "Posts fetched successfully for studio"));
  });
  getUserVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 5, search } = req.query;
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const matchStage = { userId: user._id };
    if (search) {
      matchStage.title = { $regex: search, $options: "i" };
    }
    const aggregate = Video.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "videoId",
          as: "likes"
        }
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "videoId",
          as: "comments"
        }
      },
      {
        $addFields: {
          likes: { $size: "$likes" },
          comments: { $size: "$comments" }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          thumbnail: 1,
          source: 1,
          visibility: 1,
          createdAt: 1,
          likes: 1,
          comments: 1,
          views: 1,
          duration: 1,
          categories: 1,
        }
      }
    ]);
    const videos = await Video.aggregatePaginate(aggregate, { page, limit })

    return res.status(200).json(new ApiResponse(200, { videos }, "Videos fetched successfully for studio"));
  });
  getUserPlaylists = asyncHandler(async (req, res) => {
    const { page = 1, limit = 5, search } = req.query;
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const matchStage = { userId: user._id };
    if (search) {
      matchStage.name = { $regex: search, $options: "i" };
    }
    const aggregate = Playlist.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "videos"
        }
      },
      {
        $addFields: {
          videoCount: { $size: "$videos" },
          thumbnail: { $first: "$videos.thumbnail" }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          type: 1,
          visibility: 1,
          updatedAt: 1,
          videos: 1,
          shorts: 1,
          videoCount: 1,
          thumbnail: 1,
        }
      }
    ]);
    const playlists = await Playlist.aggregatePaginate(aggregate, { page, limit })

    return res.status(200).json(new ApiResponse(200, { playlists }, "Playlists fetched successfully for studio"));
  });
  getUserShorts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 5, search } = req.query;
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const matchStage = { userId: user._id };
    if (search) {
      matchStage.title = { $regex: search, $options: "i" };
    }
    const aggregate = Short.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "shortId",
          as: "likes"
        }
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "shortId",
          as: "comments"
        }
      },
      {
        $addFields: {
          likes: { $size: "$likes" },
          comments: { $size: "$comments" }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          thumbnail: 1,
          source: 1,
          visibility: 1,
          createdAt: 1,
          likes: 1,
          comments: 1,
          views: 1,
          duration: 1,
          categories: 1,
        }
      }
    ]);
    const shorts = await Short.aggregatePaginate(aggregate, { page, limit })

    return res.status(200).json(new ApiResponse(200, { shorts }, "User shorts retrieved successfully"));
  });

  generateAiMetadata = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const document = await Video.findById(id) || await Short.findById(id);

    if (!document) {
      throw new ApiError(404, "Document not found");
    }

    if (document.userId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You do not have permission to generate metadata for this video");
    }

    if (document.subtitleStatus !== "READY") {
      throw new ApiError(400, "Subtitles are not ready yet. Please wait for transcription to complete.");
    }

    try {
      const cacheKey = `ai_metadata:${id}`;
      const cachedMetadata = await getCache(cacheKey);

      if (cachedMetadata) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.write(`data: ${JSON.stringify({ chunk: cachedMetadata })}\n\n`);
        return res.end();
      }

      const url = new URL(document.source);
      const bucketName = url.hostname.split('.')[0];
      const key = url.pathname.slice(1);
      const splits = key.split('/');
      splits.pop();
      const subtitlePath = `${splits.join('/')}/subtitle.vtt`;

      let subtitleText;
      try {
        subtitleText = await getObjectAsString(subtitlePath, bucketName);
      } catch (err) {
        if (err.name === 'NoSuchKey') {
          throw new ApiError(404, "Subtitle file not found on the server. The AI cannot generate metadata.");
        }
        throw err;
      }

      if (!subtitleText) {
        throw new ApiError(500, "Failed to fetch subtitle content");
      }

      const stream = await generateMetadataFromSubtitleStream(subtitleText);
      if (!stream) {
        throw new ApiError(500, "AI failed to generate metadata");
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let accumulatedText = "";
      for await (const chunk of stream) {
        const chunkText = chunk.text();
        accumulatedText += chunkText;
        res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
      }

      await setCache(cacheKey, accumulatedText, 86400);

      res.end();
    } catch (error) {
      logger.error(`Error in generateAiMetadata: ${error.message}`, error);
      if (!res.headersSent) {
        res.status(500).json(new ApiResponse(500, null, "Failed to generate AI metadata: " + error.message));
      } else {
        res.end();
      }
    }
  });
}

export const studioController = new StudioController();