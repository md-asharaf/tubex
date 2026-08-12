import { asyncHandler } from "../utils/handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { Video } from "../models/video.js";
import { User } from "../models/user.js";
import { Like } from "../models/like.js";
import { Playlist } from "../models/playlist.js";
import { Subscription } from "../models/subscription.js"
import { publishNotification } from "../lib/kafka/producer.js";
import { getCache, setCache } from "../lib/redis.js";
import { Types } from "mongoose"
import { deleteS3Folder } from "../lib/s3-client.js";
import { logger } from "../utils/logger.js";
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET;
const ObjectId = Types.ObjectId;
class VideoController {
  publishVideo = asyncHandler(async (req, res) => {
    const user = req.user;
    const data = req.body;
    const { height, size, ...rest } = data;
    const video = await Video.create({
      ...rest,
      userId: user._id
    })
    user.limit -= size;
    await user.save({ validateBeforeSave: false })
    if (!video.title && rest.title) {
      //publishing notification
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
      const message = `@${user.username} uploaded : "${rest.title}"`;
      subscribers.forEach((s) => {
        publishNotification({
          userId: s.subscriberId,
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
      })
      //end
    }
    let cache = {};
    [360, 480, 720, 1080]
      .filter(h => h <= height)
      .forEach(res => (cache[res] = false));
    await setCache(rest._id, cache)
    return res.status(200).json(new ApiResponse(200, null, "Video published successfully"))
  })

  deleteVideo = asyncHandler(async (req, res) => {
    if (!OUTPUT_BUCKET) {
      logger.warn("OUTPUT_BUCKET is not defined");
      throw new ApiError(500, "OUTPUT_BUCKET is not defined");
    }
    const { videoId } = req.params;
    const userId = req.user?._id;
    if (!videoId) throw new ApiError(400, "video id is required")
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "invalid videoId")
    }
    if (video.userId.toString() !== userId.toString()) {
      throw new ApiError(400, "You are not authorized to delete this video")
    }

    try {
      if (video.source && video.source.includes('s3.ap-south-1.amazonaws.com')) {
        const urlParts = video.source.split('/');
        const masterM3u8Index = urlParts.indexOf('master.m3u8');
        if (masterM3u8Index > 0) {
          const baseName = urlParts[masterM3u8Index - 1];
          if (baseName) {
            await deleteS3Folder(OUTPUT_BUCKET, `${baseName}/`);
          }
        }
      }
    } catch (s3Error) {
      console.error("Error deleting video from S3:", s3Error);
    }

    await Video.findByIdAndDelete(video._id);
    return res.status(200).json(new ApiResponse(200, null, "Video deleted successfully"))
  })
  updateVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const user = req.user;
    if (!videoId) throw new ApiError(400, "videoId is required")
    const { playlists, ...rest } = req.body;
    const video = await Video.findOneAndUpdate({ _id: new ObjectId(videoId), userId: user._id }, {
      $set: {
        ...rest
      }
    });
    if (!video) {
      throw new ApiError(500, "Invalid videoId")
    }
    if (playlists && playlists.length) {
      const allPlaylists = await Playlist.find({ userId: user._id });
      const playlistsToRemove = allPlaylists
        .filter(playlist => playlist.videos.includes(video._id) && !playlists.includes(playlist._id.toString()))
        .map(playlist => playlist._id);
      const playlistsToAdd = allPlaylists
        .filter(playlist => !playlist.videos.includes(video._id) && playlists.includes(playlist._id.toString()))
        .map(playlist => playlist._id);
      const updatePromises = [];
      if (playlistsToRemove.length) {
        updatePromises.push(
          Playlist.updateMany(
            { _id: { $in: playlistsToRemove } },
            { $pull: { videos: video._id } }
          )
        );
      }
      if (playlistsToAdd.length) {
        updatePromises.push(
          Playlist.updateMany(
            { _id: { $in: playlistsToAdd } },
            { $push: { videos: video._id } }
          )
        );
      }
      await Promise.all(updatePromises);
    }
    return res.status(200).json(new ApiResponse(200, null, "Video updated successfully"))
  })
  getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const likedVideos = await Like.aggregate([
      {
        $match: {
          userId,
          videoId: { $ne: null },
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videoId",
          foreignField: "_id",
          as: "video",
        },
      },
      {
        $addFields: {
          video: { $first: "$video" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "video.userId",
          foreignField: "_id",
          as: "creator",
        },
      },
      {
        $addFields: {
          creator: {
            $first: "$creator",
          },
        },
      },
      {
        $project: {
          _id: "$video._id",
          title: "$video.title",
          thumbnail: "$video.thumbnail",
          source: "$video.source",
          thumbnailPreviews: "$video.thumbnailPreviews",
          duration: "$video.duration",
          views: "$video.views",
          createdAt: "$video.createdAt",
          updatedAt: "$video.updatedAt",
          creator: {
            _id: 1,
            username: 1,
            fullname: 1,
            avatar: 1,
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { likedVideos },
          "All liked videos fetched successfully"
        )
      );
  });

  getSubscribedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const subscriptions = await Subscription.find({ subscriberId: userId });
    const channelIds = subscriptions.map((sub) => sub.channelId);

    const aggregate = Video.aggregate([
      {
        $match: {
          userId: { $in: channelIds },
          visibility: "public",
          sourceStatus: "READY",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "creator",
        },
      },
      {
        $addFields: {
          creator: { $first: "$creator" },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          thumbnail: 1,
          thumbnailPreviews: 1,
          source: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
          creator: {
            _id: 1,
            username: 1,
            fullname: 1,
            avatar: 1,
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const videos = await Video.aggregatePaginate(aggregate, { page, limit });
    return res.status(200).json(new ApiResponse(200, { videos }, "Subscribed videos fetched successfully"));
  });

  getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.aggregate(
      [
        {
          $match: {
            _id: new ObjectId(videoId)
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "creator"
          }
        }, {
          $addFields: {
            creator: {
              $first: "$creator"
            }
          }
        }, {
          $project: {
            userId: 0,
            __v: 0
          }
        }
      ]
    )
    if (!video || video.length === 0) {
      throw new ApiError(404, "Video not found")
    }

    const videoData = video[0];
    if (videoData.visibility === "private" && videoData.creator._id.toString() !== req.user?._id?.toString()) {
      throw new ApiError(403, "This video is private");
    }

    return res.status(200).json(new ApiResponse(200, { video: videoData }, "Video fetched successfully"))
  })
  getVideosByUserId = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) throw new ApiError(400, "Please provide username")
    const user = await User.findOne({ username })
    if (!user) throw new ApiError(400, "User not found")
    const isOwner = req.user?._id?.toString() === user._id.toString();
    const visibilityMatch = isOwner 
      ? { $in: ["public", "private", "unlisted"] } 
      : "public";

    const videos = await Video.aggregate([
      {
        $match: {
          userId: user._id,
          visibility: visibilityMatch,
          sourceStatus: "READY"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "creator",
        }
      },
      {
        $addFields: {
          creator: {
            $first: "$creator"
          }
        }
      }, {
        $project: {
          userId: 0,
          __v: 0,
        }
      }, {
        $sort: {
          createdAt: -1
        }
      }
    ])
    return res.status(200).json(new ApiResponse(200, { videos }, "this channel's all videos fetched successfully"))
  })

  getVideosByQuery = asyncHandler(async (req, res) => {
    const { query, page = 1, limit = 12 } = req.query;

    if (!query) throw new ApiError(400, "Please provide a search query");

    const skip = (page - 1) * limit;

    const pipeline = [
      // Match stage: Search in title and description
      {
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
          visibility: "public",
          sourceStatus: "READY",
        },
      },
      // Lookup stage: Fetch creator details
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "creator",
        },
      },
      // Flatten creator array
      {
        $addFields: {
          creator: { $first: "$creator" },
        },
      },
      // Scoring logic: Combine views, recency, and relevance
      {
        $addFields: {
          customScore: {
            $add: [
              { $multiply: [{ $divide: ["$views", 1000] }, 0.4] }, // Views weight
              {
                $multiply: [
                  { $subtract: [new Date(), "$createdAt"] },
                  -0.00000001,
                ],
              }, // Recency weight
              {
                $cond: {
                  if: {
                    $or: [
                      { $regexMatch: { input: "$title", regex: query, options: "i" } },
                      { $regexMatch: { input: "$description", regex: query, options: "i" } },
                    ],
                  },
                  then: 1.5, // Relevance boost
                  else: 0,
                },
              },
            ],
          },
        },
      },
      // Exclude sensitive fields
      {
        $project: {
          userId: 0,
          __v: 0,
        },
      },
      // Sort by custom score
      {
        $sort: { customScore: -1 },
      },
      // Pagination
      { $skip: skip },
      { $limit: parseInt(limit) },
    ];

    const videos = await Video.aggregate(pipeline);

    return res.status(200).json(
      new ApiResponse(200, { videos }, "Videos fetched successfully")
    );
  });

  getRecommendedVideos = asyncHandler(async (req, res) => {
    const { videoId, userId, category, page = 1, limit = 12 } = req.query;
    let video;
    let user;
    if (videoId) {
      video = await Video.findById(videoId);
    }
    let categoryQuery = category === 'All' ? {} : { categories: { $in: [category] } };
    const cacheKey = `recommended-videos:${category}:${userId}:${videoId}`;
    let allVideos = await getCache(cacheKey);
    if (!allVideos) {
      let recommendations = [];
      let notToBeRecommended = [];
      if (video) {
        notToBeRecommended.push(video._id.toString());
      }

      if (userId) {
        user = await User.findById(userId);
        // Fetch user-specific recommendations first
        if (video) {
          const videosBySameCreator = await Video.find({
            ...categoryQuery,
            userId: video.userId,
            visibility: "public",
            sourceStatus: "READY",
            _id: { $nin: notToBeRecommended }
          }).populate("userId", "username fullname avatar")
          if (videosBySameCreator.length) {
            recommendations.push(...videosBySameCreator);
            notToBeRecommended.push(...videosBySameCreator.map(v => v._id.toString()));
          }
        }

        if (video?.categories?.length) {
          const videosBySameCategories = await Video.find({
            ...categoryQuery,
            visibility: "public",
            sourceStatus: "READY",
            categories: { $in: video.categories },
            _id: { $nin: notToBeRecommended }
          }).populate("userId", "username fullname avatar")
          if (videosBySameCategories.length) {
            recommendations.push(...videosBySameCategories);
            notToBeRecommended.push(...videosBySameCategories.map(v => v._id.toString()));
          }
        }

        const usersWithSimilarHistory = await User.find({
          _id: { $ne: userId },
          "watchHistory.videoIds": { $in: user.watchHistory.videoIds || [] }
        })

        for (let similarUser of usersWithSimilarHistory) {
          let videos = await Video.find(
            {
              ...categoryQuery,
              _id: {
                $nin: notToBeRecommended,
                $in: similarUser.watchHistory?.videoIds || []
              },
              visibility: "public",
              sourceStatus: "READY"
            }
          ).limit(5).populate("userId", "username fullname avatar")
          if (videos.length) {
            recommendations.push(...videos);
            notToBeRecommended.push(...videos.map(v => v._id.toString()));
          }
        }
      }

      let remainingSlots = 50 - recommendations.length;
      if (remainingSlots) {
        let split1 = Math.floor(remainingSlots / 2);
        let split2 = remainingSlots - split1;

        let recentVideos = await Video.find({
          ...categoryQuery,
          visibility: "public",
          sourceStatus: "READY",
          _id: { $nin: notToBeRecommended }
        })
          .sort({ createdAt: -1 }).limit(split1).populate("userId", "username fullname avatar")

        if (recentVideos.length) {
          recommendations.push(...recentVideos);
          notToBeRecommended.push(...recentVideos.map(v => v._id.toString()));
        }

        let popularVideos = await Video.find({ _id: { $nin: notToBeRecommended }, visibility: "public", sourceStatus: "READY", ...categoryQuery })
          .sort({ views: -1 }).limit(split2).populate("userId", "username fullname avatar")
        if (popularVideos.length) {
          recommendations.push(...popularVideos);
          notToBeRecommended.push(...popularVideos.map(v => v._id.toString()));
        }
      }
      recommendations = recommendations.map(r => {
        r._doc.creator = r._doc.userId;
        delete r._doc.userId;
        return r._doc;
      });
      await setCache(cacheKey, recommendations);
      allVideos = recommendations;
    }

    const scoreVideo = async (video, user) => {
      let score = 0;
      if (video.views) {
        score += video.views * 0.3;
      }
      if (video.createdAt) {
        const daysSincePosted = (new Date() - new Date(video.createdAt)) / (1000 * 3600 * 24);
        score += Math.max(0, 30 - daysSincePosted) * 1;
      }
      if (video.categories?.length && user) {
        // Assume some custom logic here to calculate similarity score with user's watch history
        const watchedCategories = user.watchHistory.categories || [];
        const commonCategories = video.categories.filter(tag => watchedCategories.includes(tag));
        score += commonCategories.length * 2; // Boost score for videos with common categories
      }

      return score;
    };

    const getVideoScores = async (videos) => {
      const scores = await Promise.all(videos.map(v => scoreVideo(v, user)));
      return videos.map((v, i) => ({ ...v, score: scores[i] }));
    };

    allVideos = await getVideoScores(allVideos);
    allVideos.sort((a, b) => b.score - a.score);

    const startIndex = (page - 1) * limit;
    const paginatedVideos = allVideos.slice(startIndex, startIndex + limit);

    return res.status(200).json(new ApiResponse(200, { recommendations: paginatedVideos }, 'Recommended Videos fetched successfully'));
  }
  );

  increaseViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) throw new ApiError(400, "Please provide videoId")
    const video = await Video.findById(videoId);
    video.views++;
    await video.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200, null, "successfully video's views increased"))
  })

  getUserVideosCount = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
      throw new ApiError(400, "user id is required");
    }
    const videosCount = await Video.countDocuments({ userId: new ObjectId(userId) })
    return res.status(200).json(new ApiResponse(200, { videosCount }, "videos count fetched successfully"))
  })
}

export const videoController = new VideoController();