import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"
import { errorHandler } from "./utils/handler.js";
import { userRoutes } from "./routes/user.js";
import { postRoutes } from "./routes/post.js";
import { commentRoutes } from "./routes/comment.js";
import { likeRoutes } from "./routes/like.js";
import { subscriptionRoutes } from "./routes/subscription.js";
import { videoRoutes } from "./routes/video.js";
import { shortRoutes } from "./routes/short.js";
import { playlistRoutes } from "./routes/playlist.js";
import { notificationRoutes } from "./routes/notification.js";
import { uploadRoutes } from "./routes/upload.js";
import { replyRoutes } from "./routes/reply.js"
import { studioRoutes } from "./routes/studio.js"
import { webhookRoutes } from "./routes/webhook.js";
import bodyParser from "body-parser"
const ORIGIN = process.env.CLIENT_URL

const app = express();

app.use(cors({
  origin: [ORIGIN],
  credentials: true
}))

app.use(bodyParser.json({
  limit: "30mb"
}))

app.use(bodyParser.urlencoded({
  limit: "30mb",
  extended: true
}))

app.use(express.json());

app.use(express.static("public"))

app.use(cookieParser())

app.use("/api/v1/users", userRoutes)

app.use("/api/v1/posts", postRoutes)

app.use("/api/v1/shorts", shortRoutes)

app.use("/api/v1/comments", commentRoutes)

app.use("/api/v1/likes", likeRoutes)

app.use("/api/v1/subscriptions", subscriptionRoutes)

app.use("/api/v1/videos", videoRoutes)

app.use("/api/v1/playlists", playlistRoutes)

app.use("/api/v1/uploads", uploadRoutes)

app.use('/api/v1/notifications', notificationRoutes)

app.use('/api/v1/replies', replyRoutes)

app.use('/api/v1/studio', studioRoutes)

app.use("/api/v1/webhooks", webhookRoutes)

app.use(errorHandler)

export { app }