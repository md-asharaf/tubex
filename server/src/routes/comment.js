import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import { detectEmotion } from "../middlewares/sentiment.js";
import { commentController } from "../controllers/comment.js"
import { limiter } from "../utils/rate-limiter.js";
const router = Router();
router.get("/comments-count", commentController.commentsCount)
router.get("/all-video-comments/:videoId", commentController.getAllVideoComments);
router.get("/all-short-comments/:shortId", commentController.getAllShortComments);
router.get("/all-post-comments/:postId", commentController.getAllPostComments);
router.post("/add-comment-to-video/:videoId", limiter(10), verifyJWT, detectEmotion, commentController.addCommentToVideo);
router.post("/add-comment-to-short/:shortId", limiter(10), verifyJWT, detectEmotion, commentController.addCommentToShort);
router.post("/add-comment-to-post/:postId", limiter(10), verifyJWT, detectEmotion, commentController.addCommentToPost);
router.patch("/update-comment/:commentId", verifyJWT, commentController.updateComment);
router.delete("/delete-comment/:commentId", verifyJWT, commentController.deleteComment);

export const commentRoutes = router;