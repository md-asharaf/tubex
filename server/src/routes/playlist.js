import { Router } from "express";
import { verifyJWT, optionalAuth } from "../middlewares/auth.js";
import { playlistController } from "../controllers/playlist.js"
import { limiter } from "../utils/rate-limiter.js";
const router = Router();

router.get("/search-playlists", optionalAuth, playlistController.getPlaylistsByQuery);
router.get("/all-playlists/:username", optionalAuth, playlistController.getUserPlaylists);
router.get("/is-video-saved", verifyJWT, playlistController.isSavedToPlaylists);
router.get("/:playlistId", optionalAuth, playlistController.getPlaylistById);
router.post("/create-playlist", limiter(3), verifyJWT, playlistController.createPlaylist);
router.use(verifyJWT);
router.patch("/update-playlist/:playlistId", playlistController.updatePlaylist);
router.patch("/add-video-to-playlist/:playlistId", playlistController.addToPlaylist);
router.patch("/remove-video-from-playlist/:playlistId", playlistController.removeFromPlaylist);
router.delete("/delete-playlist/:playlistId", playlistController.deletePlaylist);


export const playlistRoutes = router;