import { asyncHandler } from "../utils/handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { Short } from "../models/short.js";
import { User } from "../models/user.js";
import { Like } from "../models/like.js";
import { Playlist } from "../models/playlist.js";
import { Subscription } from "../models/subscription.js";
import { publishNotification } from "../lib/kafka/producer.js";
import { getCache, setCache } from "../lib/redis.js";
import { Types } from "mongoose"
const ObjectId = Types.ObjectId;
class ShortController {
  publishShort = asyncHandler(async (req, res) => {
    const user = req.user;
    const data = req.body;
    const { height, size = 0, ...rest } = data;
    const short = await Short.create({
      ...rest,
      userId: user._id
    })
    user.limit -= size;
    if (!short.title && rest.title) {
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
      })
      //end
    }
    await user.save({ validateBeforeSave: false });
    const cache = { [height]: false };
    await setCache(rest._id, cache)
    return res.status(200).json(new ApiResponse(200, null, "Short published successfully"))
  })

  deleteShort = asyncHandler(async (req, res) => {
    const { shortId } = req.params;
    const userId = req.user?._id;
    if (!shortId) throw new ApiError(400, "Short id is required")
    const short = await Short.findById(shortId);
    if (!short) {
      throw new ApiError(400, "invalid ShortId")
    }
    if (short.userId.toString() !== userId.toString()) {
      throw new ApiError(400, "You are not authorized to delete this Short")
    }
    await Short.findByIdAndDelete(short._id);
    return res.status(200).json(new ApiResponse(200, null, "Short deleted successfully"))
  })
  getRandomShortId = asyncHandler(async (req, res) => {
    const short = await Short.aggregate([
      {
        $match: {
          visibility: "public",
          sourceStatus: "READY"
        }
      },
      { $sample: { size: 1 } },
      { $project: { _id: 1 } },
    ]);
    return res.status(200).json(new ApiResponse(200, { shortId: short[0]._id }, "Random ShortId fetched successfully"))
  })
  updateShortDetails = asyncHandler(async (req, res) => {
    const { shortId } = req.params;
    const user = req.user;
    if (!shortId) throw new ApiError(400, "ShortId is required")
    const { playlists, ...rest } = req.body;
    const short = await Short.findByIdAndUpdate({ _id: new ObjectId(shortId), userId: user._id }, {
      $set: {
        ...rest
      }
    });
    if (!short) {
      throw new ApiError(500, "Invalid ShortId")
    }
    if (playlists.length) {
      const allPlaylists = await Playlist.find({ userId: user._id });
      const playlistsToRemove = allPlaylists
        .filter(playlist => playlist.shorts.includes(short._id) && !playlists.includes(playlist._id))
        .map(playlist => playlist._id);
      const playlistsToAdd = allPlaylists
        .filter(playlist => !playlist.shorts.includes(short._id) && playlists.includes(playlist._id))
        .map(playlist => playlist._id);
      const updatePromises = [];
      if (playlistsToRemove.length) {
        updatePromises.push(
          Playlist.updateMany(
            { _id: { $in: playlistsToRemove } },
            { $pull: { shorts: short._id } }
          )
        );
      }
      if (playlistsToAdd.length) {
        updatePromises.push(
          Playlist.updateMany(
            { _id: { $in: playlistsToAdd } },
            { $push: { shorts: short._id } }
          )
        );
      }
      await Promise.all(updatePromises);
    }
    return res.status(200).json(new ApiResponse(200, null, "Short updated successfully"))
  })

  getLikedShorts = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const likedShorts = await Like.aggregate([
      {
        $match: {
          userId,
          shortId: { $ne: null },
        },
      },
      {
        $lookup: {
          from: "shorts",
          localField: "shortId",
          foreignField: "_id",
          as: "short",
        },
      },
      {
        $addFields: {
          Short: { $first: "$short" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "short.userId",
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
          _id: "$short._id",
          title: "$short.title",
          thumbnail: "$short.thumbnail",
          duration: "$short.duration",
          views: "$short.views",
          createdAt: "$short.createdAt",
          updatedAt: "$short.updatedAt",
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
          { likedShorts },
          "All liked Shorts fetched successfully"
        )
      );
  });

  getShortById = asyncHandler(async (req, res) => {
    const { shortId } = req.params;

    let short = await Short.findById(shortId)
      .populate("userId", "username fullname avatar")
      .select("-__v")
      .lean();

    short.creator = short.userId;
    delete short.userId;

    short.next = (await Short.findOne({ createdAt: { $gt: short.createdAt } })
      .sort({ createdAt: 1 })
      .select("_id")
      .lean())?._id ?? "";

    short.prev = (await Short.findOne({ createdAt: { $lt: short.createdAt } })
      .sort({ createdAt: -1 })
      .select("_id")
      .lean())?._id ?? "";
    return res.status(200).json(new ApiResponse(200, { short }, "Short fetched successfully"));
  });

  getShortsByUsername = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) throw new ApiError(400, "Please provide username")
    const user = await User.findOne({ username });
    if (!user) throw new ApiError(400, "Please provide valid username")
    const shorts = await Short.aggregate([
      {
        $match: {
          userId: user._id,
          visibility: "public",
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
    return res.status(200).json(new ApiResponse(200, { shorts }, "this channel's all Shorts fetched successfully"))
  })

  getShortsByQuery = asyncHandler(async (req, res) => {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) throw new ApiError(400, "Please provide a search query");

    const skip = (page - 1) * limit;

    const pipeline = [
      // Match stage: Search in title and description
      {
        $match: {
          visibility: "public",
          sourceStatus: "READY",
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
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

    const shorts = await Short.aggregate(pipeline);
    return res.status(200).json(
      new ApiResponse(200, { shorts }, "Shorts fetched successfully")
    );
  });

  getRecommendedShorts = asyncHandler(async (req, res) => {
    const { shortId, userId, page = 1, limit = 12 } = req.query;
    // Validate pagination inputs
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.max(1, Math.min(50, parseInt(limit) || 12));

    let short;
    let user;
    if (shortId) {
      short = await Short.findById(shortId);
    }
    const cacheKey = `recommended-shorts:${userId}:${shortId}`;

    let allShorts = await getCache(cacheKey);
    if (!allShorts) {
      let recommendations = [];
      let notToBeRecommended = [];
      if (short) {
        notToBeRecommended.push(short._id.toString());
      }

      if (userId) {
        user = await User.findById(userId);
        // Fetch user-specific recommendations first
        if (short) {
          const shortsBySameCreator = await Short.find({
            visibility: "public",
            sourceStatus: "READY",
            userId: short.userId,
            _id: { $nin: notToBeRecommended }
          }).populate("userId", "username fullname avatar").limit(10)
          if (shortsBySameCreator.length) {
            recommendations.push(...shortsBySameCreator);
            notToBeRecommended.push(...shortsBySameCreator.map(s => s._id.toString()));
          }
        }

        if (short?.categories?.length) {
          const shortsBySameCategories = await Short.find({
            visibility: "public",
            sourceStatus: "READY",
            categories: { $in: short.categories },
            _id: { $nin: notToBeRecommended }
          }).populate("userId", "username fullname avatar").limit(10)

          if (shortsBySameCategories.length) {
            recommendations.push(...shortsBySameCategories);
            notToBeRecommended.push(...shortsBySameCategories.map(s => s._id.toString()));
          }
        }

        // Limit to 10 users to avoid N+1 query problem
        const usersWithSimilarHistory = await User.find({
          _id: { $ne: userId },
          "watchHistory.shortIds": { $in: user.watchHistory.shortIds || [] }
        }).limit(10)

        for (let similarUser of usersWithSimilarHistory) {
          let shorts = await Short.find({
            visibility: "public",
            sourceStatus: "READY",
            _id: {
              $nin: notToBeRecommended,
              $in: similarUser.watchHistory?.shortIds || []
            }
          }).limit(5).populate("userId", "username fullname avatar")
          if (shorts.length) {
            recommendations.push(...shorts);
            notToBeRecommended.push(...shorts.map(s => s._id.toString()));
          }
        }
      }

      let remainingSlots = 50 - recommendations.length;
      if (remainingSlots) {
        let split1 = Math.floor(remainingSlots / 2);
        let split2 = remainingSlots - split1;

        let recentShorts = await Short.find({
          visibility: "public",
          sourceStatus: "READY",
          _id: { $nin: notToBeRecommended }
        })
          .sort({ createdAt: -1 }).limit(split1).populate("userId", "username fullname avatar")

        if (recentShorts.length) {
          recommendations.push(...recentShorts);
          notToBeRecommended.push(...recentShorts.map(s => s._id.toString()));
        }

        let popularShorts = await Short.find({ _id: { $nin: notToBeRecommended }, visibility: "public", sourceStatus: "READY" })
          .sort({ views: -1 }).limit(split2).populate("userId", "username fullname avatar")

        if (popularShorts.length) {
          recommendations.push(...popularShorts);
          notToBeRecommended.push(...popularShorts.map(s => s._id.toString()));
        }
      }
      recommendations = recommendations.map(r => {
        r._doc.creator = r._doc.userId;
        delete r._doc.userId;
        return r._doc;
      });
      await setCache(cacheKey, recommendations);
      allShorts = recommendations;
    }
    const scoreShort = async (short, user) => {
      let score = 0;
      if (short.views) {
        score += short.views * 0.3;
      }
      if (short.createdAt) {
        const daysSincePosted = (new Date() - new Date(short.createdAt)) / (1000 * 3600 * 24);
        score += Math.max(0, 30 - daysSincePosted) * 1;
      }
      if (short.categories?.length && user) {
        // Assume some custom logic here to calculate similarity score with user's watch history
        const watchedCategories = user.watchHistory.categories || [];
        const commonCategories = short.categories.filter(tag => watchedCategories.includes(tag));
        score += commonCategories.length * 2; // Boost score for shorts with common categories
      }
      return score;
    };

    const getShortScores = async (shorts) => {
      const scores = await Promise.all(shorts.map(s => scoreShort(s, user)));
      return shorts.map((s, i) => ({ ...s, score: scores[i] }));
    };

    allShorts = await getShortScores(allShorts);
    allShorts.sort((a, b) => b.score - a.score);

    const startIndex = (validPage - 1) * validLimit;
    const paginatedShorts = allShorts.slice(startIndex, startIndex + validLimit);

    return res.status(200).json(new ApiResponse(200, { recommendations: paginatedShorts }, 'Recommended Shorts fetched successfully'));
  })

  increaseViews = asyncHandler(async (req, res) => {
    const { shortId } = req.params;
    if (!shortId) throw new ApiError(400, "Please provide ShortId")
    const short = await Short.findById(shortId);
    if (!short) {
      throw new ApiError(404, "Short not found");
    }
    short.views++;
    await short.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200, null, "successfully Short's views increased"))
  })
}

export const shortController = new ShortController();