import { Router } from "express";
import { studioController } from "../controllers/studio.js";
import { verifyJWT } from "../middlewares/auth.js";
const router = Router();

router.get("/posts/:username", studioController.getUserPosts);
router.get("/videos/:username", studioController.getUserVideos);
router.get("/playlists/:username", studioController.getUserPlaylists);
router.get("/shorts/:username", studioController.getUserShorts);
router.post("/generate-ai-metadata/:id", verifyJWT, studioController.generateAiMetadata);

export const studioRoutes = router;
