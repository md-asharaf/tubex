import mongoose from "mongoose";
import MAP from 'mongoose-aggregate-paginate-v2';
const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    video: {
        _id: String,
        thumbnail: String,
    },
    post: {
        _id: String,
        image: String,
    },
    short: {
        _id: String,
        thumbnail: String,
    },
    message: {
        type: String,
        required: true
    },
    creator: {
        _id: String,
        fullname: String,
        username: String,
        avatar: String,
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        required: true,
    }
});

notificationSchema.plugin(MAP);

export const Notification = mongoose.model('Notification', notificationSchema);
