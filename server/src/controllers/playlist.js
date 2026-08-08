import { asyncHandler } from "../utils/handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { Playlist } from "../models/playlist.js";
import { User } from "../models/user.js";
import { Types } from "mongoose"
const ObjectId = Types.ObjectId;
class PlaylistController {
  addToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const userId = req.user?._id;
    const { videoId, shortId } = req.query;
    if (!playlistId) {
      throw new ApiError(400, "PlaylistId is required");
    }
    if (!videoId && !shortId) {
      throw new ApiError(400, "VideoId or shortId is required");
    }
    const updateQuery = videoId ? { videos: new ObjectId(videoId) } : { shorts: new ObjectId(shortId) };
    const playlist = await Playlist.findOneAndUpdate({ _id: new ObjectId(playlistId), userId }, {
      $push: updateQuery
    }, {
      new: true
    });
    if (!playlist) {
      throw new ApiError(500, "Failed to add video to playlist");
    }
    return res.status(200).json(new ApiResponse(200, null, "added to playlist successfully"));
  })
  removeFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const userId = req.user?._id;
    const { videoId, shortId } = req.query;
    if (!playlistId) {
      throw new ApiError(400, "PlaylistId is required");
    }
    if (!videoId && !shortId) {
      throw new ApiError(400, "VideoId or shortId is required");
    }
    const playlist = await Playlist.findOne({ _id: new ObjectId(playlistId), userId });
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    const updateQuery = videoId ? { videos: new ObjectId(videoId) } : { shorts: new ObjectId(shortId) };
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlist._id, {
      $pull: updateQuery
    }, {
      new: true
    });
    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"));
  })
  deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const userId = req.user?._id;
    if (!playlistId) {
      throw new ApiError(400, "PlaylistId is required")
    }
    const playlist = await Playlist.findOne({ _id: new ObjectId(playlistId), userId });
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    const isDeleted = await Playlist.findByIdAndDelete(playlist._id);
    if (!isDeleted) {
      throw new ApiError(500, "Failed to delete playlist");
    }
    return res.status(200).json(new ApiResponse(200, null, "Playlist deleted successfully"));
  })
  updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const userId = req.user?._id;
    const { name, description } = req.body
    if ((!name && !description) || !playlistId) {
      throw new ApiError(400, "Name or description and playlistId is required");
    }
    const playlist = await Playlist.findOne({ _id: new ObjectId(playlistId), userId });
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    if (name) {
      playlist.name = name;
    }
    if (description) {
      playlist.description = description;
    }
    const updatedPlaylist = await playlist.save({ validateBeforeSave: false });
    if (!updatedPlaylist) {
      throw new ApiError(500, "Failed to update playlist");
    }
    return res.status(200).json(new ApiResponse(200, null, "Playlist updated successfully"));
  })
  createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user?._id;
    if (!name) {
      throw new ApiError(400, "Name is required")
    }
    const playlist = await Playlist.create({
      name,
      description,
      userId
    })
    if (!playlist) {
      throw new ApiError(500, "Failed to create playlist");
    }
    return res.status(201).json(new ApiResponse(201, null, "Playlist created successfully"));
  })
  isSavedToPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { videoId, shortId } = req.query;
    if (!videoId && !shortId) {
      throw new ApiError(400, "VideoId or shortId is required");
    }
    const playlists = await Playlist.find({ userId: new ObjectId(userId), visibility: "public" });
    let isSaved = [];
    for (let playlist of playlists) {
      isSaved.push(videoId ? playlist.videos.includes(videoId) : playlist.shorts.includes(shortId))
    }
    return res.status(200).json(new ApiResponse(200, { isSaved }, "playlist saved status fetched successfully"));
  })
  getUserPlaylists = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) {
      throw new ApiError(400, "Username is required")
    }
    const user = await User.findOne({ username });
    if (!user) {
      throw new ApiError(404, "User not found")
    }
    const playlists = await Playlist.aggregate([
      {
        $match: {
          visibility: "public",
          userId: user._id
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "video",
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
                fullname: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          thumbnail: {
            $first: "$video.thumbnail"
          },
          creator: {
            $first: "$creator"
          }
        }
      },
      {
        $project: {
          userId: 0,
          video: 0
        }
      }
    ]);

    return res.status(200).json(new ApiResponse(200, { playlists }, "Playlists fetched successfully"))
  })
  getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!playlistId) {
      throw new ApiError(400, "PlaylistId is required")
    }
    const playlists = await Playlist.aggregate([
      {
        $match: {
          _id: new ObjectId(playlistId),
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "videos",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "creator",
                pipeline: [
                  {
                    $project: {
                      fullname: 1
                    }
                  }
                ]
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
                userId: 0
              }
            }
          ]
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
                fullname: 1
              }
            }
          ]
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
          userId: 0
        }
      }
    ]);
    if (!playlists) {
      throw new ApiError(404, "Playlist not found")
    }
    return res.status(200).json(new ApiResponse(200, { playlist: playlists[0] }, "Playlist fetched successfully"));
  })
  
  getPlaylistsByQuery = asyncHandler(async (req, res) => {
    const { query, page = 1, limit = 10 } = req.query;
    if (!query) throw new ApiError(400, "Please provide a search query");

    const skip = (page - 1) * limit;

    const playlists = await Playlist.aggregate([
      {
        $match: {
          visibility: "public",
          $or: [
            { name: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
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
        },
      },
      {
        $addFields: {
          creator: { $first: "$creator" },
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "video",
        }
      },
      {
        $addFields: {
          thumbnail: { $first: "$video.thumbnail" }
        }
      },
      {
        $project: {
          userId: 0,
          video: 0,
          __v: 0,
        },
      },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    return res.status(200).json(
      new ApiResponse(200, { playlists }, "Playlists fetched successfully")
    );
  });
}

export const playlistController = new PlaylistController();