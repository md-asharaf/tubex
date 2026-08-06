import { likeController } from "../controllers/like.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";

const router = Router();

router.get("/likes-count", likeController.likesCount)
router.get('/video-comments-likes-count/:videoId', likeController.videoCommentsLikeCount);
router.get('/short-comments-likes-count/:shortId', likeController.shortCommentsLikeCount);
router.get('/post-comments-likes-count/:postId', likeController.postCommentsLikeCount);
router.get('/comment-replies-likes-count/:commentId', likeController.commentRepliesLikeCount);

router.use(verifyJWT);
router.get(`/is-liked`, likeController.isLiked);
router.post("/toggle-comment-like/:commentId", likeController.toggleCommentLike);
router.post("/toggle-short-like/:shortId", likeController.toggleShortLike);
router.post("/toggle-video-like/:videoId", likeController.toggleVideoLike);
router.post("/toggle-post-like/:postId", likeController.togglePostLike);
router.post("/toggle-reply-like/:replyId", likeController.toggleReplyLike);
router.get('/video-comments-like-status/:videoId', likeController.likedStatusofVideoComments);
router.get('/short-comments-like-status/:shortId', likeController.likedStatusofShortComments);
router.get('/post-comments-like-status/:postId', likeController.likedStatusofPostComments);
router.get('/comment-replies-like-status/:commentId', likeController.likedStatusofCommentReplies);

export const likeRoutes = router;