import { Router } from "express";
import { verifyJWT, optionalAuth } from "../middlewares/auth.js";
import { shortController } from "../controllers/short.js";
const router = Router();
router.get("/search-shorts", optionalAuth, shortController.getShortsByQuery);
router.get("/random-short", optionalAuth, shortController.getRandomShortId);
router.get("/recommended-shorts", optionalAuth, shortController.getRecommendedShorts);
router.get("/user-shorts/:username", optionalAuth, shortController.getShortsByUsername);
router.get("/liked-shorts", verifyJWT, shortController.getLikedShorts);
router.get("/:shortId", optionalAuth, shortController.getShortById);
router.post("/increase-views/:shortId", shortController.increaseViews)
router.use(verifyJWT);
router.post("/publish-short", shortController.publishShort);
router.delete("/delete-short/:shortId", shortController.deleteShort);
router.patch("/update-short/:shortId", shortController.updateShortDetails);

export const shortRoutes = router;