import { model, Schema } from "mongoose";
import MAP from "mongoose-aggregate-paginate-v2"
const playlistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    type: {
        type: String,
        default: "playlist"
    },
    videos: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video",
        }
    ],
    visibility: {
        type: String,
        enum: ["public", "private"],
        default: "private"
    },
    shorts: [
        {
            type: Schema.Types.ObjectId,
            ref: "Short",
        }
    ],
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
}, { timestamps: true });
playlistSchema.plugin(MAP);
export const Playlist = model("PlayList", playlistSchema);