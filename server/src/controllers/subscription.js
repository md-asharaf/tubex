import { asyncHandler } from "../utils/handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { Subscription } from "../models/subscription.js";
import { User } from "../models/user.js";
import { publishNotification } from "../lib/kafka/producer.js";
import { Types } from "mongoose"
const ObjectId = Types.ObjectId;
class SubscriptionController {

  toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriber = req.user;
    if (!channelId) {
      throw new ApiError(400, "Channel Id is required")
    }
    if (channelId === subscriber._id.toString()) {
      throw new ApiError(403, "You cannot subscribe to your own channel")
    }
    let subscription = await Subscription.findOne({ channelId: new ObjectId(channelId), subscriberId: subscriber._id });
    const message = `@${subscriber.username} ${subscription ? "unsubscribed" : "subscribed"} to your channel`
    if (subscription) {
      await Subscription.findByIdAndDelete(subscription._id, { new: true });
      subscription = null;
    }
    else {
      subscription = await Subscription.create({ channelId, subscriberId });

    }
    //send notification here
    publishNotification({
      userId: channelId,
      message,
      creator: {
        _id: subscriber._id,
        avatar: subscriber.avatar,
        fullname: subscriber.fullname
      },
      read: false,
      createdAt: new Date(Date.now()),
    })
    return res.status(201).json(new ApiResponse(201, null, `${!subscription ? "Unsubscribed" : "Subscribed"} successfully`));
  })

  getSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) {
      throw new ApiError(400, "Channel Id is required");
    }
    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channelId: new ObjectId(channelId),
          _id: { $ne: new ObjectId(channelId) }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriberId",
          foreignField: "_id",
          as: "name"
        }
      },
      {
        $addFields: {
          name: {
            $first: "$name.fullname"
          },
          id: {
            $first: "$name._id"
          }
        }
      },
      {
        $project: {
          name: 1,
          id: 1,
          _id: 0
        }
      }
    ]);
    return res.status(200).json(new ApiResponse(200, {
      subscribersCount: subscribers.length,
      subscribers
    }, "Subscribed channels fetched successfully"));
  })

  getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if (!subscriberId) {
      throw new ApiError(400, "Subscriber Id is required");
    }
    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
      throw new ApiError(404, "Subscriber not found");
    }
    const subscribedChannels = await Subscription.aggregate([
      {
        $match: {
          subscriberId: new ObjectId(subscriberId)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "channelId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $addFields: {
          fullname: {
            $first: "$user.fullname"
          },
          username: {
            $first: "$user.username"
          },
          avatar: {
            $first: "$user.avatar"
          }
        }
      },
      {
        $project: {
          fullname: 1,
          username: 1,
          avatar: 1,
        }
      }
    ]);
    return res.status(200).json(new ApiResponse(200, { subscribedChannels }, "Subscribed channels fetched successfully"));
  })

  isSubscribed = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user?._id;
    if (!channelId) {
      throw new ApiError(400, "Channel Id is required")
    }
    const isSubscribed = await Subscription.findOne({ channelId: new ObjectId(channelId), subscriberId }) ? true : false;
    return res.status(200).json(new ApiResponse(200, { isSubscribed }, `User is ${isSubscribed ? "" : "not"} subscribed to this channel`));
  })
  getSubscribersCount = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) {
      throw new ApiError(400, "Channel Id is required");
    }
    const subscribersCount = await Subscription.countDocuments({ channelId: new ObjectId(channelId) });
    return res.status(200).json(new ApiResponse(200, { subscribersCount }, "Subscribers count fetched successfully"));
  })
}

export const subscriptionController = new SubscriptionController();