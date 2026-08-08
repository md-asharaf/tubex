import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import { videoController } from "../controllers/video.js";
const router = Router();

router.get("/search-videos", videoController.getVideosByQuery);
router.get("/videos-count/:userId", videoController.getUserVideosCount)
router.get("/recommended-videos", videoController.getRecommendedVideos);
router.get("/user-videos/:username", videoController.getVideosByUserId);
router.get("/subscribed-videos", verifyJWT, videoController.getSubscribedVideos);
router.get("/liked-videos", verifyJWT, videoController.getLikedVideos);
router.get("/:videoId", videoController.getVideoById);
router.post("/increase-views/:videoId", videoController.increaseViews)
router.use(verifyJWT);
router.post("/publish-video", videoController.publishVideo);
router.delete("/delete-video/:videoId", videoController.deleteVideo);
// router.patch("/update-thumbnail/:videoId", videoController.updateVideoThumbnail);
router.patch("/update-video/:videoId", videoController.updateVideoDetails);

export const videoRoutes = router;